require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../src/app');
const db = require('../src/db/pool');

const request = supertest(app);

let nurseToken = '';
let deptNurseToken = '';
let testPackId = null;
let testBatchId = null;
let testPackCode = '';

describe('器械包全流程测试', () => {
  before(async () => {
    testPackCode = 'TEST-FLOW-' + Date.now();

    const res = await request
      .post('/api/auth/login')
      .send({ username: 'lixd', password: 'sn123' });
    nurseToken = res.body.token;

    const deptRes = await request
      .post('/api/auth/login')
      .send({ username: 'wangks', password: 'dn123' });
    deptNurseToken = deptRes.body.token;
  });

  after(async () => {
    if (testPackId) {
      await db.query('DELETE FROM pack_logs WHERE pack_id = $1', [testPackId]);
    }
    if (testBatchId) {
      await db.query('DELETE FROM batch_packs WHERE batch_id = $1', [testBatchId]);
      await db.query('DELETE FROM sterilization_cards WHERE batch_id = $1', [testBatchId]);
      await db.query('DELETE FROM sterilization_batches WHERE id = $1', [testBatchId]);
    }
    if (testPackId) {
      await db.query('DELETE FROM instrument_packs WHERE id = $1', [testPackId]);
    }
  });

  describe('POST /api/packs - 创建器械包', () => {
    it('成功创建器械包', async () => {
      const res = await request
        .post('/api/packs')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ code: testPackCode, name: '流程测试器械包', category: '外科' });

      expect(res.status).to.equal(201);
      expect(res.body.code).to.equal(testPackCode);
      expect(res.body.status).to.equal('new');
      testPackId = res.body.id;
    });

    it('重复编码返回409', async () => {
      const res = await request
        .post('/api/packs')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ code: testPackCode, name: '重复编码包' });

      expect(res.status).to.equal(409);
    });

    it('缺少名称返回400', async () => {
      const res = await request
        .post('/api/packs')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ code: 'TEST-FLOW-NONAME-' + Date.now() });

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /api/packs/:id/scan - 扫码回收', () => {
    it('新建状态可以扫码回收', async () => {
      const res = await request
        .post(`/api/packs/${testPackId}/scan`)
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('pending_confirm');
    });

    it('待确认状态再次扫码进入执行中', async () => {
      const res = await request
        .post(`/api/packs/${testPackId}/scan`)
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('in_progress');
    });
  });

  describe('POST /api/packs/:id/clean - 清洗登记', () => {
    it('执行中状态可以清洗登记', async () => {
      const res = await request
        .post(`/api/packs/${testPackId}/clean`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ cleaning_method: '超声波清洗', remark: '测试清洗' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('in_progress');
    });
  });

  describe('POST /api/batches - 创建灭菌批次', () => {
    it('成功创建批次', async () => {
      const res = await request
        .post('/api/batches')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          autoclave_id: 1,
          pack_ids: [testPackId],
          temperature: 134.0,
          pressure: 0.21,
        });

      expect(res.status).to.equal(201);
      expect(res.body.batch_code).to.be.a('string');
      testBatchId = res.body.id;
    });
  });

  describe('POST /api/packs/:id/sterilize - 灭菌放行', () => {
    it('灭菌合格放行', async () => {
      const res = await request
        .post(`/api/packs/${testPackId}/sterilize`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          batch_id: testBatchId,
          card_code: 'CARD-FLOW-001',
          color_change: '由蓝变黑',
          is_passed: true,
        });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('sterilized');
    });
  });

  describe('POST /api/packs/:id/dispatch - 科室领用', () => {
    it('已灭菌器械包可以科室领用', async () => {
      const res = await request
        .post(`/api/packs/${testPackId}/dispatch`)
        .set('Authorization', `Bearer ${deptNurseToken}`)
        .send({ department_id: 1 });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('archived');
    });
  });

  describe('GET /api/packs/:id/logs - 操作日志', () => {
    it('可以查看完整流转日志', async () => {
      const res = await request
        .get(`/api/packs/${testPackId}/logs`)
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(4);

      const actions = res.body.map(l => l.action);
      expect(actions).to.include('create');
      expect(actions).to.include('scan_recycle');
      expect(actions).to.include('clean_register');
      expect(actions).to.include('sterilize_release');
      expect(actions).to.include('department_dispatch');
    });
  });
});
