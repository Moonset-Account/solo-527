import 'dotenv/config';
import http from 'http';

const BASE_URL = 'http://localhost:3001';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, body: result });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function demoFeedbackHandle() {
  console.log('='.repeat(60));
  console.log('🚀 Feedback 处理方案保存 - API 完整演示');
  console.log('='.repeat(60));

  let token = '';
  let feedbackId = '';

  try {
    console.log('\n1️⃣  登录获取 Token');
    const loginRes = await request('/api/auth/login', { method: 'POST' }, {
      username: 'admin',
      password: '123456'
    });
    if (loginRes.status !== 200) {
      throw new Error(`登录失败: ${loginRes.status} - ${JSON.stringify(loginRes.body)}`);
    }
    token = loginRes.body.token;
    console.log('   ✅ 登录成功');
    console.log('   Token:', token.substring(0, 20) + '...');

    console.log('\n2️⃣  获取反馈列表，找到一条审核中的反馈');
    const listRes = await request('/api/feedbacks?status=reviewing', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (listRes.status !== 200) {
      throw new Error(`获取列表失败: ${listRes.status}`);
    }
    const feedbacks = listRes.body.feedbacks || listRes.body.data || [];
    if (feedbacks.length === 0) {
      throw new Error('没有找到审核中的反馈，请先运行 seed');
    }
    const targetFeedback = feedbacks.find(f => f.title === '优化排班系统') || feedbacks[0];
    feedbackId = targetFeedback._id;
    console.log('   ✅ 找到反馈:', targetFeedback.title);
    console.log('   ID:', feedbackId);
    console.log('   当前状态:', targetFeedback.status);

    console.log('\n3️⃣  查看反馈详情（处理前）');
    const beforeRes = await request(`/api/feedbacks/${feedbackId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const beforeFeedback = beforeRes.body.feedback;
    console.log('   状态:', beforeFeedback.status);
    console.log('   处理方案:', beforeFeedback.handlePlan || '(空)');
    console.log('   处理人:', beforeFeedback.handler?.name || '(空)');
    console.log('   处理时间:', beforeFeedback.handledAt || '(空)');

    console.log('\n4️⃣  调用 /feedbacks/:id/handle 保存处理方案');
    const handlePlan = '计划下个月升级排班系统，增加调班功能，预计2周内完成';
    const handleRes = await request(
      `/api/feedbacks/${feedbackId}/handle`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      },
      {
        handlePlan,
        status: 'handling'
      }
    );
    if (handleRes.status !== 200) {
      throw new Error(`处理失败: ${handleRes.status} - ${JSON.stringify(handleRes.body)}`);
    }
    console.log('   ✅ 处理方案保存成功！');
    console.log('   返回状态码:', handleRes.status);
    console.log('   保存的处理方案:', handleRes.body.feedback?.handlePlan);

    console.log('\n5️⃣  重新读取反馈详情（处理后）');
    const afterRes = await request(`/api/feedbacks/${feedbackId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const afterFeedback = afterRes.body.feedback;
    console.log('   ✅ 重新读取成功');
    console.log('   ┌─────────────────────────────────');
    console.log('   │ 状态：', afterFeedback.status, '(处理中)');
    console.log('   │ 处理方案：', afterFeedback.handlePlan);
    console.log('   │ 处理人：', afterFeedback.handler?.name, `(${afterFeedback.handler?.role})`);
    console.log('   │ 处理时间：', afterFeedback.handledAt);
    console.log('   └─────────────────────────────────');

    console.log('\n6️⃣  验证前端可展示字段');
    const hasAllFields = afterFeedback.status === 'handling'
      && afterFeedback.handlePlan
      && afterFeedback.handler?.name
      && afterFeedback.handledAt;
    if (hasAllFields) {
      console.log('   ✅ 所有展示字段齐全：状态/处理方案/处理人/处理时间');
      console.log('   ✅ 前端详情页将正确显示「处理中」徽章和处理方案卡片');
    } else {
      console.log('   ❌ 字段不完整');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 演示完成！处理方案通过 API 成功保存');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 演示失败:', error.message);
    console.error('\n💡 提示：请确保');
    console.error('   1. MongoDB 已启动');
    console.error('   2. Redis 已启动');
    console.error('   3. 后端服务已启动 (npm run dev --workspace=server)');
    console.error('   4. 已运行 seed (npm run seed --workspace=server)');
    process.exit(1);
  }
}

demoFeedbackHandle();
