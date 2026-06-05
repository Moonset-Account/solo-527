const express = require('express');
const db = require('../db/pool');
const authGuard = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

router.get('/', authGuard, rbac('autoclave:manage'), async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM autoclaves ORDER BY code');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询消毒锅失败' });
  }
});

router.post('/', authGuard, rbac('autoclave:manage'), async (req, res) => {
  const { name, code, model, max_capacity } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: '名称和编码不能为空' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO autoclaves (name, code, model, max_capacity) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, code, model || null, max_capacity || 20]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: '消毒锅编码已存在' });
    }
    res.status(500).json({ error: '创建消毒锅失败' });
  }
});

module.exports = router;
