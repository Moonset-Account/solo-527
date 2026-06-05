const express = require('express');
const db = require('../db/pool');
const authGuard = require('../middleware/auth');

const router = express.Router();

router.get('/', authGuard, async (req, res) => {
  try {
    const statusMap = {
      'new': '新建',
      'pending_confirm': '待确认',
      'in_progress': '执行中',
      'exception_review': '异常复核',
      'archived': '已归档',
    };

    const { rows } = await db.query(
      `SELECT ip.*, d.name as department_name
       FROM instrument_packs ip
       LEFT JOIN departments d ON d.id = ip.current_department_id
       WHERE DATE(ip.updated_at) = CURRENT_DATE
          OR ip.status IN ('new','pending_confirm','in_progress','exception_review')
       ORDER BY ip.updated_at DESC`
    );

    const columns = {};
    for (const [status, label] of Object.entries(statusMap)) {
      columns[status] = { label, items: [] };
    }

    for (const pack of rows) {
      if (columns[pack.status]) {
        columns[pack.status].items.push(pack);
      }
    }

    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: '查询看板数据失败' });
  }
});

module.exports = router;
