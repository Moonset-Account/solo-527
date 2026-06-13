const http = require('http');

const cookieData = encodeURIComponent(JSON.stringify({
  state: {
    currentUser: {
      id: 'user-001',
      email: 'admin@company.com',
      name: '系统管理员',
      role: 'admin',
      department_id: 'dept-001'
    }
  },
  version: 0
}));

const routes = [
  '/',
  '/statistics',
  '/tasks/task-001',
  '/admin/tasks',
  '/admin/audit',
  '/login'
];

function checkRoute(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
      path,
      method: 'GET',
      headers: {
        'Cookie': `weekly-meeting-dashboard-store=${cookieData}`
      }
    };
    const start = Date.now();
    const req = http.request(options, (res) => {
      const elapsed = Date.now() - start;
      let body = '';
      res.on('data', (chunk) => { body += chunk.toString(); });
      res.on('end', () => {
        const isRedirect = res.headers.location;
        console.log(`[${res.statusCode}] ${path.padEnd(22)} ${elapsed}ms ${isRedirect ? '→ ' + isRedirect : '✓'}`);
        resolve({ path, status: res.statusCode, redirect: isRedirect });
      });
    });
    req.on('error', (err) => {
      console.log(`[ERR] ${path}: ${err.message}`);
      resolve({ path, status: 0, error: err.message });
    });
    req.end();
  });
}

async function main() {
  console.log('===== Admin 登录后路由访问测试 =====\n');
  for (const route of routes) {
    await checkRoute(route);
  }
  console.log('\n测试完成。');
}

main();
