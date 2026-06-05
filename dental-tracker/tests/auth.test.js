require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../src/app');

const request = supertest(app);

let adminToken = '';
let nurseToken = '';
let deptNurseToken = '';

describe('认证与权限测试', () => {
  before(async () => {
    try {
      const adminRes = await request
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      adminToken = adminRes.body.token;

      const nurseRes = await request
        .post('/api/auth/login')
        .send({ username: 'lixd', password: 'sn123' });
      nurseToken = nurseRes.body.token;

      const deptRes = await request
        .post('/api/auth/login')
        .send({ username: 'wangks', password: 'dn123' });
      deptNurseToken = deptRes.body.token;
    } catch (e) {
      console.error('测试登录失败:', e.message);
    }
  });



  describe('POST /api/auth/login', () => {
    it('管理员登录成功', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).to.equal(200);
      expect(res.body.token).to.be.a('string');
      expect(res.body.user.role).to.equal('admin');
    });

    it('消毒护士登录成功', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ username: 'lixd', password: 'sn123' });

      expect(res.status).to.equal(200);
      expect(res.body.user.role).to.equal('sterilization_nurse');
    });

    it('密码错误返回401', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(res.status).to.equal(401);
    });

    it('用户名缺失返回400', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ password: 'admin123' });

      expect(res.status).to.equal(400);
    });
  });

  describe('路由守卫测试', () => {
    it('无Token访问受保护接口返回401', async () => {
      const res = await request.get('/api/packs');
      expect(res.status).to.equal(401);
    });

    it('无效Token访问返回401', async () => {
      const res = await request
        .get('/api/packs')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).to.equal(401);
    });
  });

  describe('RBAC 角色权限测试', () => {
    it('科室护士无权创建器械包', async () => {
      const res = await request
        .post('/api/packs')
        .set('Authorization', `Bearer ${deptNurseToken}`)
        .send({ code: 'TEST-PK-001', name: '测试包' });

      expect(res.status).to.equal(403);
    });

    it('科室护士无权执行召回', async () => {
      const res = await request
        .post('/api/recall')
        .set('Authorization', `Bearer ${deptNurseToken}`)
        .send({ batch_id: 999, reason: '测试' });

      expect(res.status).to.equal(403);
    });

    it('消毒护士可以创建器械包', async () => {
      const res = await request
        .post('/api/packs')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ code: 'TEST-PK-RBAC-001', name: '权限测试包', category: '内科' });

      expect(res.status).to.equal(201);
    });

    it('管理员可以查看科室列表', async () => {
      const res = await request
        .get('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
    });
  });
});
