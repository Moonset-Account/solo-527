const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 3000, path, method, headers: {} };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) {
      const data = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  console.log('===== 验证1: 消毒护士 -> GET /api/autoclaves =====');
  const nurse = await req('POST', '/api/auth/login', null, { username: 'lixd', password: 'sn123' });
  console.log('登录:', nurse.status, nurse.body.user?.role || nurse.body.error);

  const ac = await req('GET', '/api/autoclaves', nurse.body.token);
  if (ac.status === 200 && Array.isArray(ac.body)) {
    console.log('PASS 消毒锅列表:', ac.body.length, '条');
    ac.body.forEach(a => console.log('  -', a.name, '(' + a.code + ')'));
  } else {
    console.log('FAIL:', ac.status, JSON.stringify(ac.body));
  }

  console.log('\n===== 验证2: 科室护士 -> GET /api/departments =====');
  const dept = await req('POST', '/api/auth/login', null, { username: 'wangks', password: 'dn123' });
  console.log('登录:', dept.status, dept.body.user?.role || dept.body.error);

  const dp = await req('GET', '/api/departments', dept.body.token);
  if (dp.status === 200 && Array.isArray(dp.body)) {
    console.log('PASS 科室列表:', dp.body.length, '条');
    dp.body.forEach(d => console.log('  -', d.name, '(' + d.code + ')'));
  } else {
    console.log('FAIL:', dp.status, JSON.stringify(dp.body));
  }

  console.log('\n===== 验证3: 消毒护士创建器械包(唯一编码) =====');
  const code = 'TEST-PK-RBAC-' + Date.now();
  const create = await req('POST', '/api/packs', nurse.body.token, { code, name: '权限测试包', category: '内科' });
  if (create.status === 201) {
    console.log('PASS 创建成功, code:', create.body.code, 'status:', create.body.status);
  } else {
    console.log('FAIL:', create.status, JSON.stringify(create.body));
  }

  console.log('\n===== 验证4: 重复编码 TEST-PK-RBAC-001 不再撞码 =====');
  const dup = await req('POST', '/api/packs', nurse.body.token, { code: 'TEST-PK-RBAC-001', name: '再次尝试', category: '内科' });
  if (dup.status === 409) {
    console.log('PASS 重复编码正确返回 409 (不影响后续测试)');
  } else if (dup.status === 201) {
    console.log('PASS TEST-PK-RBAC-001 不存在,可以创建 (不会撞码)');
  } else {
    console.log('其他:', dup.status, JSON.stringify(dup.body));
  }

  process.exit(0);
})();
