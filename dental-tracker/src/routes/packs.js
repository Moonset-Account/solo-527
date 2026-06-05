const express = require('express');
const db = require('../db/pool');
const authGuard = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

router.get('/', authGuard, rbac('pack:view'), async (req, res) => {
  try {
    const { status, keyword } = req.query;
    let sql = `SELECT ip.*, d.name as department_name
               FROM instrument_packs ip
               LEFT JOIN departments d ON d.id = ip.current_department_id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status) {
      sql += ` AND ip.status = $${idx++}`;
      params.push(status);
    }
    if (keyword) {
      sql += ` AND (ip.code ILIKE $${idx} OR ip.name ILIKE $${idx})`;
      params.push(`%${keyword}%`);
      idx++;
    }

    sql += ' ORDER BY ip.updated_at DESC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询器械包失败' });
  }
});

router.get('/:id', authGuard, rbac('pack:view'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ip.*, d.name as department_name
       FROM instrument_packs ip
       LEFT JOIN departments d ON d.id = ip.current_department_id
       WHERE ip.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: '器械包不存在' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: '查询器械包失败' });
  }
});

router.post('/', authGuard, rbac('pack:create'), async (req, res) => {
  const { code, name, category } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: '编码和名称不能为空' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO instrument_packs (code, name, category, status)
       VALUES ($1, $2, $3, 'new') RETURNING *`,
      [code, name, category]
    );

    await db.query(
      `INSERT INTO pack_logs (pack_id, action, from_status, to_status, operator_id)
       VALUES ($1, 'create', NULL, 'new', $2)`,
      [rows[0].id, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: '器械包编码已存在' });
    }
    res.status(500).json({ error: '创建器械包失败' });
  }
});

router.post('/:id/scan', authGuard, rbac('pack:scan'), async (req, res) => {
  const packId = req.params.id;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM instrument_packs WHERE id = $1 FOR UPDATE',
      [packId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '器械包不存在' });
    }

    const pack = rows[0];
    if (pack.is_frozen) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '器械包已被冻结，无法操作' });
    }

    const validTransitions = {
      'new': 'pending_confirm',
      'pending_confirm': 'in_progress',
      'in_progress': 'in_progress',
    };

    if (!validTransitions[pack.status]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `当前状态 ${pack.status} 不允许扫码回收` });
    }

    const newStatus = validTransitions[pack.status];

    await client.query(
      'UPDATE instrument_packs SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, packId]
    );

    await client.query(
      `INSERT INTO pack_logs (pack_id, action, from_status, to_status, operator_id)
       VALUES ($1, 'scan_recycle', $2, $3, $4)`,
      [packId, pack.status, newStatus, req.user.id]
    );

    await client.query('COMMIT');
    res.json({ id: packId, status: newStatus });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '扫码回收失败' });
  } finally {
    client.release();
  }
});

router.post('/:id/clean', authGuard, rbac('pack:clean'), async (req, res) => {
  const packId = req.params.id;
  const { cleaning_method, remark } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM instrument_packs WHERE id = $1 FOR UPDATE',
      [packId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '器械包不存在' });
    }

    const pack = rows[0];
    if (pack.is_frozen) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '器械包已被冻结，无法操作' });
    }

    if (pack.status !== 'pending_confirm' && pack.status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '当前状态不允许清洗登记' });
    }

    await client.query(
      'UPDATE instrument_packs SET status = $1, updated_at = NOW() WHERE id = $2',
      ['in_progress', packId]
    );

    await client.query(
      `INSERT INTO pack_logs (pack_id, action, from_status, to_status, operator_id, remark)
       VALUES ($1, 'clean_register', $2, 'in_progress', $3, $4)`,
      [packId, pack.status, req.user.id, remark || cleaning_method || null]
    );

    await client.query('COMMIT');
    res.json({ id: packId, status: 'in_progress' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '清洗登记失败' });
  } finally {
    client.release();
  }
});

router.post('/:id/sterilize', authGuard, rbac('pack:sterilize'), async (req, res) => {
  const packId = req.params.id;
  const { batch_id, card_code, color_change, is_passed } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: packRows } = await client.query(
      'SELECT * FROM instrument_packs WHERE id = $1 FOR UPDATE',
      [packId]
    );
    if (packRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '器械包不存在' });
    }

    const pack = packRows[0];
    if (pack.is_frozen) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '器械包已被冻结，无法操作' });
    }

    if (pack.status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '当前状态不允许灭菌放行' });
    }

    if (!batch_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '必须指定灭菌批次' });
    }

    const newStatus = is_passed === false ? 'exception_review' : 'sterilized';

    await client.query(
      'UPDATE instrument_packs SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, packId]
    );

    await client.query(
      `INSERT INTO batch_packs (batch_id, pack_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [batch_id, packId]
    );

    if (card_code) {
      await client.query(
        `INSERT INTO sterilization_cards (batch_id, pack_id, card_code, color_change, is_passed, checked_by, checked_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [batch_id, packId, card_code, color_change || null, is_passed !== false, req.user.id]
      );
    }

    await client.query(
      `INSERT INTO pack_logs (pack_id, action, from_status, to_status, operator_id, batch_id, remark)
       VALUES ($1, 'sterilize_release', $2, $3, $4, $5, $6)`,
      [packId, pack.status, newStatus, req.user.id, batch_id, is_passed === false ? '灭菌指示卡不合格' : null]
    );

    await client.query('COMMIT');
    res.json({ id: packId, status: newStatus });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '灭菌放行失败' });
  } finally {
    client.release();
  }
});

router.post('/:id/dispatch', authGuard, rbac('pack:dispatch'), async (req, res) => {
  const packId = req.params.id;
  const { department_id } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM instrument_packs WHERE id = $1 FOR UPDATE',
      [packId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '器械包不存在' });
    }

    const pack = rows[0];
    if (pack.is_frozen) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '器械包已被冻结，无法领用' });
    }

    if (pack.status !== 'sterilized') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '当前状态不允许科室领用，需先完成灭菌' });
    }

    await client.query(
      'UPDATE instrument_packs SET status = $1, current_department_id = $2, updated_at = NOW() WHERE id = $3',
      ['archived', department_id, packId]
    );

    await client.query(
      `INSERT INTO pack_logs (pack_id, action, from_status, to_status, operator_id, department_id)
       VALUES ($1, 'department_dispatch', $2, 'archived', $3, $4)`,
      [packId, pack.status, req.user.id, department_id]
    );

    await client.query('COMMIT');
    res.json({ id: packId, status: 'archived', department_id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '科室领用失败' });
  } finally {
    client.release();
  }
});

router.get('/:id/logs', authGuard, rbac('pack:view'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pl.*, o.name as operator_name
       FROM pack_logs pl
       LEFT JOIN operators o ON o.id = pl.operator_id
       WHERE pl.pack_id = $1
       ORDER BY pl.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询日志失败' });
  }
});

module.exports = router;
