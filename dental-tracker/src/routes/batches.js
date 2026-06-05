const express = require('express');
const db = require('../db/pool');
const authGuard = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { createNotification } = require('../services/notification.service');

const router = express.Router();

router.get('/', authGuard, rbac('batch:view'), async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT sb.*, a.name as autoclave_name, o.name as operator_name
               FROM sterilization_batches sb
               LEFT JOIN autoclaves a ON a.id = sb.autoclave_id
               LEFT JOIN operators o ON o.id = sb.operator_id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status) {
      sql += ` AND sb.status = $${idx++}`;
      params.push(status);
    }

    sql += ' ORDER BY sb.created_at DESC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询批次失败' });
  }
});

router.get('/:id', authGuard, rbac('batch:view'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT sb.*, a.name as autoclave_name, o.name as operator_name
       FROM sterilization_batches sb
       LEFT JOIN autoclaves a ON a.id = sb.autoclave_id
       LEFT JOIN operators o ON o.id = sb.operator_id
       WHERE sb.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: '批次不存在' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: '查询批次失败' });
  }
});

router.get('/:id/packs', authGuard, rbac('batch:view'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ip.* FROM instrument_packs ip
       JOIN batch_packs bp ON bp.pack_id = ip.id
       WHERE bp.batch_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询批次器械包失败' });
  }
});

router.post('/', authGuard, rbac('batch:create'), async (req, res) => {
  const { autoclave_id, pack_ids, temperature, pressure } = req.body;
  if (!autoclave_id || !pack_ids || !pack_ids.length) {
    return res.status(400).json({ error: '消毒锅和器械包不能为空' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const batchCode = `BATCH-${Date.now()}`;

    const { rows } = await client.query(
      `INSERT INTO sterilization_batches (batch_code, autoclave_id, operator_id, status, temperature, pressure, start_time)
       VALUES ($1, $2, $3, 'pending', $4, $5, NOW()) RETURNING *`,
      [batchCode, autoclave_id, req.user.id, temperature || null, pressure || null]
    );

    const batch = rows[0];

    for (const packId of pack_ids) {
      await client.query(
        'INSERT INTO batch_packs (batch_id, pack_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [batch.id, packId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(batch);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '创建批次失败' });
  } finally {
    client.release();
  }
});

router.post('/:id/confirm', authGuard, rbac('batch:confirm'), async (req, res) => {
  const batchId = req.params.id;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM sterilization_batches WHERE id = $1 FOR UPDATE',
      [batchId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '批次不存在' });
    }

    const batch = rows[0];
    if (batch.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '只有待确认批次可以确认' });
    }

    await client.query(
      'UPDATE sterilization_batches SET status = $1, end_time = NOW(), updated_at = NOW() WHERE id = $2',
      ['confirmed', batchId]
    );

    await client.query('COMMIT');
    res.json({ id: batchId, status: 'confirmed' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '确认批次失败' });
  } finally {
    client.release();
  }
});

router.post('/:id/abnormal', authGuard, rbac('batch:recall'), async (req, res) => {
  const batchId = req.params.id;
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ error: '异常原因不能为空' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: batchRows } = await client.query(
      'SELECT * FROM sterilization_batches WHERE id = $1 FOR UPDATE',
      [batchId]
    );
    if (batchRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '批次不存在' });
    }

    const batch = batchRows[0];
    if (batch.is_abnormal) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '批次已标记为异常' });
    }

    await client.query(
      'UPDATE sterilization_batches SET is_abnormal = TRUE, status = $1, updated_at = NOW() WHERE id = $2',
      ['abnormal', batchId]
    );

    const { rows: packRows } = await client.query(
      `SELECT ip.id, ip.status FROM instrument_packs ip
       JOIN batch_packs bp ON bp.pack_id = ip.id
       WHERE bp.batch_id = $1`,
      [batchId]
    );

    for (const pack of packRows) {
      await client.query(
        'UPDATE instrument_packs SET is_frozen = TRUE, status = $1, updated_at = NOW() WHERE id = $2',
        ['exception_review', pack.id]
      );

      await client.query(
        `INSERT INTO pack_logs (pack_id, action, from_status, to_status, operator_id, batch_id, remark)
         VALUES ($1, 'recall_freeze', $2, 'exception_review', $3, $4, '批次异常召回冻结')`,
        [pack.id, pack.status, req.user.id, batchId]
      );
    }

    await client.query(
      `INSERT INTO recall_records (batch_id, operator_id, reason, status)
       VALUES ($1, $2, $3, 'active')`,
      [batchId, req.user.id, reason]
    );

    await createNotification(client, {
      type: 'recall',
      title: `灭菌批次 ${batch.batch_code} 异常召回`,
      content: `原因: ${reason}，涉及 ${packRows.length} 个器械包已被冻结`,
      target_role_id: (await client.query("SELECT id FROM roles WHERE name = 'infection_control'")).rows[0].id,
    });

    await client.query('COMMIT');
    res.json({
      batch_id: batchId,
      recalled_packs: packRows.length,
      status: 'abnormal',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '异常标记失败' });
  } finally {
    client.release();
  }
});

module.exports = router;
