const STORE_KEY = 'weekly-meeting-dashboard-store';

async function fetchPage(path, cookie) {
  const res = await fetch(`http://localhost:3004${path}`, {
    headers: { 'Cookie': cookie },
    redirect: 'manual',
  });
  const html = await res.text();
  return { status: res.status, html, location: res.headers.get('location') };
}

async function main() {
  const adminCookie = `${STORE_KEY}=${encodeURIComponent(JSON.stringify({
    state: { currentUser: { id:'user-001', email:'admin@company.com', name:'系统管理员', role:'admin', department_id:'dept-001' }},
    version: 0
  }))}`;

  console.log('===== 页面渲染验证 (admin@company.com) =====\n');

  const pages = [
    { path: '/', name: '看板首页', checks: ['周会事项看板'] },
    { path: '/statistics', name: '统计分析', checks: ['统计分析', '闭环率'] },
    { path: '/tasks/task-001', name: '事项详情(task-001)', checks: ['更新员工培训计划', 'Q3培训方案', '认领', '附件'] },
    { path: '/admin/tasks', name: '后台事项配置', checks: ['事项配置'] },
    { path: '/admin/audit', name: '审计日志', checks: ['审计日志', '附件缺失', 'upload_attachment', 'claim'] },
  ];

  for (const page of pages) {
    const { status, html, location } = await fetchPage(page.path, adminCookie);
    if (status >= 300 && status < 400) {
      console.log(`[REDIRECT ${status}] ${page.name} (${page.path}) → ${location}`);
      continue;
    }
    const found = page.checks.map(c => ({ keyword: c, present: html.includes(c) }));
    const allFound = found.every(f => f.present);
    const icon = allFound ? '✓' : '✗';
    console.log(`[${icon}] ${page.name} (${page.path}) — HTTP ${status}`);
    for (const f of found) {
      console.log(`    ${f.present ? '✓' : '✗'} "${f.keyword}"`);
    }
    console.log();
  }
}

main().catch(console.error);
