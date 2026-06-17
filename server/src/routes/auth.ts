import { Hono } from 'hono';
import { getMemberByPhone, createMember, getMemberById, getAdminByUsername, getAdminById } from '../services/common';
import { signToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { generateRandomCode } from '../utils/generator';
import { authMiddleware } from '../middleware/auth';

const auth = new Hono();

auth.post('/member/login', async (c) => {
  const { phone, code } = await c.req.json();

  if (!phone || !code) {
    return c.json({ success: false, error: '手机号和验证码不能为空' }, 400);
  }

  let member = await getMemberByPhone(phone);

  if (!member) {
    member = await createMember({
      phone,
      nickname: `用户${phone.slice(-4)}`,
    });
  }

  const token = signToken({
    id: member.id,
    role: 'member',
    type: 'member',
  });

  return c.json({
    success: true,
    data: {
      token,
      member: {
        id: member.id,
        phone: member.phone,
        nickname: member.nickname,
        points: member.points,
        levelId: member.levelId,
      },
    },
  });
});

auth.post('/admin/login', async (c) => {
  const { username, password } = await c.req.json();

  if (!username || !password) {
    return c.json({ success: false, error: '用户名和密码不能为空' }, 400);
  }

  const admin = await getAdminByUsername(username);

  if (!admin || admin.status !== 'active') {
    return c.json({ success: false, error: '用户名或密码错误' }, 401);
  }

  const valid = await comparePassword(password, admin.passwordHash);
  if (!valid) {
    return c.json({ success: false, error: '用户名或密码错误' }, 401);
  }

  const token = signToken({
    id: admin.id,
    role: admin.role as 'ecommerce' | 'admin',
    type: 'admin',
  });

  return c.json({
    success: true,
    data: {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    },
  });
});

auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  if (user.type === 'member') {
    const member = await getMemberById(user.id);
    return c.json({
      success: true,
      data: {
        user: member,
        role: 'member',
      },
    });
  } else {
    const admin = await getAdminById(user.id);
    return c.json({
      success: true,
      data: {
        user: {
          id: admin?.id,
          username: admin?.username,
          role: admin?.role,
          status: admin?.status,
        },
        role: admin?.role,
      },
    });
  }
});

auth.post('/send-code', async (c) => {
  const { phone } = await c.req.json();

  if (!phone) {
    return c.json({ success: false, error: '手机号不能为空' }, 400);
  }

  const code = generateRandomCode(6);
  console.log(`[SMS] Send verification code ${code} to ${phone}`);

  return c.json({
    success: true,
    message: '验证码已发送（开发模式：123456）',
  });
});

export default auth;
