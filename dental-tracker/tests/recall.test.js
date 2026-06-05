require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../src/app');
const db = require('../src/db/pool');

const request = supertest(app);

let icToken = '';
let nurseToken = '';
let recallBatchId = null;
const recallPackIds = [];

describe('异常召回测试', () => {
  before(async () => {
    const icRes = await request
      .post('/api/auth/login')
      .send({ username: 'zhangyg', password: 'ic123' });
    icToken = icRes.body.token;

    const nurseRes = await request
      .post('/api/auth/login')
      .send({ username: 'lixd', password: 'sn123' });
    nurseToken = nurseRes.body.token;

    const pack1 = await request
      .post('/api/packs')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ code: 'RECALL-PK-001', name: '召回测试包1', category: '外科' });
    recallPackIds.push(pack1.body.id);

    const pack2 = await request
      .post('/api/packs')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ code: 'RECALL-PK-002', name: '召回测试包2', category: '内科' });
    recallPackIds.push(pack2.body.id);

    for (const pid of recallPackIds) {
      await request
        .post(`/api/packs/${pid}/scan`)
        .set('Authorization', `Bearer ${nurseToken}`);
      await request
        .post(`/api/packs/${pid}/scan`)
        .set('Authorization', `Bearer ${nurseToken}`);
      await request
        .post(`/api/packs/${pid}/clean`)
        .set('Authorization', `Bearer ${nurseToken}`);
    }

    const batch = await request
      .post('/api/batches')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        autoclave_id: 1,
        pack_ids: recallPackIds,
        temperature: 134.0,
        pressure: 0.21,
      });
    recallBatchId = batch.body.id;

    for (const pid of recallPackIds) {
      await request
        .post(`/api/packs/${pid}/sterilize`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          batch_id: recallBatchId,
          card_code: `CARD-RECALL-${pid}`,
          color_change: '由蓝变黑',
          is_passed: true,
        });
    }
  });

  after(async () => {
    for (const pid of recallPackIds) {
      await db.query('DELETE FROM pack_logs WHERE pack_id = $1', [pid]);
      await db.query('DELETE FROM sterilization_cards WHERE pack_id = $1', [pid]);
      await db.query('DELETE FROM instrument_packs WHERE id = $1', [pid]);
    }
    if (recallBatchId) {
      await db.query('DELETE FROM batch_packs WHERE batch_id = $1', [recallBatchId]);
      await db.query('DELETE FROM recall_records WHERE batch_id = $1', [recallBatchId]);
      await db.query('DELETE FROM notifications WHERE title LIKE $1', ['%召回%']);
      await db.query('DELETE FROM sterilization_batches WHERE id = $1', [recallBatchId]);
    }
    await db.pool.end();
  });

  describe('POST /api/batches/:id/abnormal - 批次异常标记', () => {
    it('院感负责人可以标记批次异常', async () => {
      const res = await request
        .post(`/api/batches/${recallBatchId}/abnormal`)
        .set('Authorization', `Bearer ${icToken}`)
        .send({ reason: '灭菌温度未达标' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('abnormal');
      expect(res.body.recalled_packs).to.equal(recallPackIds.length);
    });

    it('异常批次内所有器械包被冻结', async () => {
      for (const pid of recallPackIds) {
        const res = await request
          .get(`/api/packs/${pid}`)
          .set('Authorization', `Bearer ${icToken}`);

        expect(res.body.is_frozen).to.equal(true);
        expect(res.body.status).to.equal('exception_review');
      }
    });

    it('冻结器械包无法操作', async () => {
      const res = await request
        .post(`/api/packs/${recallPackIds[0]}/dispatch`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ department_id: 1 });

      expect(res.status).to.equal(403);
    });
  });

  describe('POST /api/recall - 主动召回', () => {
    it('重复标记异常返回400', async () => {
      const res = await request
        .post(`/api/batches/${recallBatchId}/abnormal`)
        .set('Authorization', `Bearer ${icToken}`)
        .send({ reason: '再次召回' });

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /api/recall/unfreeze/:pack_id - 解冻器械包', () => {
    it('院感负责人可以解冻器械包', async () => {
      const res = await request
        .post(`/api/recall/unfreeze/${recallPackIds[0]}`)
        .set('Authorization', `Bearer ${icToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.is_frozen).to.equal(false);
      expect(res.body.status).to.equal('new');
    });

    it('解冻后器械包恢复正常状态', async () => {
      const res = await request
        .get(`/api/packs/${recallPackIds[0]}`)
        .set('Authorization', `Bearer ${icToken}`);

      expect(res.body.is_frozen).to.equal(false);
      expect(res.body.status).to.equal('new');
    });
  });

  describe('GET /api/recall/records - 召回记录', () => {
    it('可以查看召回历史', async () => {
      const res = await request
        .get('/api/recall/records')
        .set('Authorization', `Bearer ${icToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body[0].reason).to.equal('灭菌温度未达标');
    });
  });
});
