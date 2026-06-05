const express = require('express');
const db = require('../db/pool');
const authGuard = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

router.get('/', authGuard, rbac('department:view'), async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM departments ORDER BY code');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询科室失败' });
  }
});

router.post('/', authGuard, rbac('department:manage'), async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: '名称和编码不能为空' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING *',
      [name, code]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: '科室编码已存在' });
    }
    res.status(500).json({ error: '创建科室失败' });
  }
});

module.exports = router;
