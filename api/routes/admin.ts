import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { db } from '../db.js';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/users', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const users: any[] = [];
    for (const [, user] of db.users) {
      const { password_hash, ...rest } = user;
      users.push(rest);
    }
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/users', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name, phone, role } = req.body;
    if (!username || !email || !password || !name || !role) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    for (const [, u] of db.users) {
      if (u.username === username) {
        res.status(400).json({ success: false, error: '用户名已存在' });
        return;
      }
    }
    const id = db.getNextId(db.users);
    const now = new Date().toISOString();
    const user = {
      id,
      username,
      email,
      password_hash: bcrypt.hashSync(password, 10),
      role,
      name,
      phone: phone || '',
      created_at: now,
      updated_at: now,
    };
    db.users.set(id, user);
    const { password_hash, ...userWithoutHash } = user;
    res.status(201).json({ success: true, data: userWithoutHash });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.put('/users/:id', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = db.users.get(id);
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }
    const updated = {
      ...user,
      ...req.body,
      id: user.id,
      created_at: user.created_at,
      updated_at: new Date().toISOString(),
    };
    if (req.body.password) {
      updated.password_hash = bcrypt.hashSync(req.body.password, 10);
    }
    delete updated.password;
    db.users.set(id, updated);
    const { password_hash, ...userWithoutHash } = updated;
    res.json({ success: true, data: userWithoutHash });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/schools', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const schools: any[] = [];
    for (const [, school] of db.schools) {
      schools.push(school);
    }
    res.json({ success: true, data: schools });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/schools', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, contact_person, phone, address } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: '缺少学校名称' });
      return;
    }
    const id = db.getNextId(db.schools);
    const school = {
      id,
      name,
      contact_person: contact_person || '',
      phone: phone || '',
      address: address || '',
      created_at: new Date().toISOString(),
    };
    db.schools.set(id, school);
    res.status(201).json({ success: true, data: school });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
