const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/pool');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const { rows } = await db.query(
      `SELECT o.id, o.name, o.username, o.password_hash, r.name as role_name
       FROM operators o
       JOIN roles r ON r.id = o.role_id
       WHERE o.username = $1 AND o.is_active = TRUE`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role_name },
    });
  } catch (err) {
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未认证' });
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const { rows } = await db.query(
      `SELECT o.id, o.name, o.username, r.name as role_name
       FROM operators o
       JOIN roles r ON r.id = o.role_id
       WHERE o.id = $1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const permResult = await db.query(
      `SELECT p.code FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
       WHERE r.id = (SELECT role_id FROM operators WHERE id = $1)`,
      [decoded.id]
    );

    const user = rows[0];
    res.json({
      ...user,
      permissions: permResult.rows.map(r => r.code),
    });
  } catch (err) {
    res.status(401).json({ error: '无效令牌' });
  }
});

module.exports = router;
