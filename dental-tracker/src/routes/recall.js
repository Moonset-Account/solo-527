const express = require('express');
const db = require('../db/pool');
const authGuard = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { createNotification } = require('../services/notification.service');

const router = express.Router();

router.post('/', authGuard, rbac('recall:execute'), async (req, res) => {
  const { batch_id, reason } = req.body;
  if (!batch_id || !reason) {
    return res.status(400).json({ error: '批次ID和召回原因不能为空' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: batchRows } = await client.query(
      'SELECT * FROM sterilization_batches WHERE id = $1 FOR UPDATE',
      [batch_id]
    );
    if (batchRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '批次不存在' });
    }

    if (batchRows[0].is_abnormal) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '批次已处于异常召回状态' });
    }

    await client.query(
      'UPDATE sterilization_batches SET is_abnormal = TRUE, status = $1, updated_at = NOW() WHERE id = $2',
      ['abnormal', batch_id]
    );

    const { rows: packRows } = await client.query(
      `SELECT ip.id, ip.status FROM instrument_packs ip
       JOIN batch_packs bp ON bp.pack_id = ip.id
       WHERE bp.batch_id = $1`,
      [batch_id]
    );

    for (const pack of packRows) {
      await client.query(
        'UPDATE instrument_packs SET is_frozen = TRUE, status = $1, updated_at = NOW() WHERE id = $2',
        ['exception_review', pack.id]
      );

      await client.query(
        `INSERT INTO pack_logs (pack_id, action, from_status, to_status, operator_id, batch_id, remark)
         VALUES ($1, 'recall_freeze', $2, 'exception_review', $3, $4, $5)`,
        [pack.id, pack.status, req.user.id, batch_id, reason]
      );
    }

    await client.query(
      `INSERT INTO recall_records (batch_id, operator_id, reason, status)
       VALUES ($1, $2, $3, 'active')`,
      [batch_id, req.user.id, reason]
    );

    const icRole = (await client.query("SELECT id FROM roles WHERE name = 'infection_control'")).rows[0];
    const snRole = (await client.query("SELECT id FROM roles WHERE name = 'sterilization_nurse'")).rows[0];

    await createNotification(client, {
      type: 'recall',
      title: `紧急召回: 批次 ${batchRows[0].batch_code}`,
      content: `原因: ${reason}，涉及 ${packRows.length} 个器械包已冻结使用`,
      target_role_id: icRole.id,
    });

    await createNotification(client, {
      type: 'recall',
      title: `紧急召回: 批次 ${batchRows[0].batch_code}`,
      content: `请立即停止使用相关器械包，共 ${packRows.length} 个`,
      target_role_id: snRole.id,
    });

    await client.query('COMMIT');
    res.json({
      batch_id,
      recalled_packs: packRows.length,
      reason,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '召回失败' });
  } finally {
    client.release();
  }
});

router.get('/records', authGuard, rbac('batch:view'), async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT rr.*, sb.batch_code, o.name as operator_name
       FROM recall_records rr
       JOIN sterilization_batches sb ON sb.id = rr.batch_id
       JOIN operators o ON o.id = rr.operator_id
       ORDER BY rr.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询召回记录失败' });
  }
});

router.post('/unfreeze/:pack_id', authGuard, rbac('recall:execute'), async (req, res) => {
  const { pack_id } = req.params;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM instrument_packs WHERE id = $1 FOR UPDATE',
      [pack_id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '器械包不存在' });
    }

    const pack = rows[0];
    if (!pack.is_frozen) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '器械包未被冻结' });
    }

    await client.query(
      'UPDATE instrument_packs SET is_frozen = FALSE, status = $1, updated_at = NOW() WHERE id = $2',
      ['new', pack_id]
    );

    await client.query(
      `INSERT INTO pack_logs (pack_id, action, from_status, to_status, operator_id, remark)
       VALUES ($1, 'unfreeze', $2, 'new', $3, '解冻恢复')`,
      [pack_id, pack.status, req.user.id]
    );

    await client.query('COMMIT');
    res.json({ id: pack_id, status: 'new', is_frozen: false });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '解冻失败' });
  } finally {
    client.release();
  }
});

module.exports = router;
