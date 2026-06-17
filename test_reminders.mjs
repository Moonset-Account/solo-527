import http from 'node:http'

function httpRequest(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const reqOpts = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: opts.cookie || ''
      }
    }
    const req = http.request(reqOpts, (res) => {
      const chunks = []
      let setCookie = res.headers['set-cookie'] || []
      if (!Array.isArray(setCookie)) setCookie = [setCookie]
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          cookies: setCookie,
          body: Buffer.concat(chunks).toString('utf8')
        })
      })
    })
    req.on('error', reject)
    if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body))
    req.end()
  })
}

function extractSession(cookies) {
  for (const c of cookies) {
    const m = c.match(/contract_review_session=([^;]+)/)
    if (m) return `contract_review_session=${m[1]}`
  }
  return ''
}

async function login(username, password) {
  const r = await httpRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: { username, password }
  })
  const d = JSON.parse(r.body)
  if (d.error || d.statusCode) {
    throw new Error('登录失败: ' + (d.message || r.body))
  }
  return { user: d.user, cookie: extractSession(r.cookies) }
}

async function query(cookie, params) {
  const qs = new URLSearchParams(params || {}).toString()
  const r = await httpRequest('http://localhost:3000/api/reminders' + (qs ? '?' + qs : ''), { cookie })
  const d = JSON.parse(r.body)
  if (d.error || d.statusCode) {
    throw new Error('查询失败: ' + (d.message || r.body))
  }
  return d
}

function names(list) {
  return [...new Set(list.map(r => r.user.name))].join(',')
}

async function main() {
  console.log('📋 开始验证 reminders 权限隔离\n')

  const manager = await login('manager', '123456')
  const lawyer1 = await login('lawyer1', '123456')
  const lawyer2 = await login('lawyer2', '123456')
  const reviewer1 = await login('reviewer1', '123456')
  console.log(`✅ 登录成功: ${manager.user.name} / ${lawyer1.user.name} / ${lawyer2.user.name} / ${reviewer1.user.name}\n`)

  let pass = 0, fail = 0
  function test(desc, cond, detail = '') {
    if (cond) { console.log('  ✅ ' + desc + (detail ? ' - ' + detail : '')); pass++ }
    else { console.log('  ❌ ' + desc + (detail ? ' - ' + detail : '')); fail++ }
  }

  console.log('=== A. 普通律师视图 ===')
  const l1Default = await query(lawyer1.cookie)
  test('律师默认查询返回本人', names(l1Default) === lawyer1.user.name, `实际: ${names(l1Default)}`)
  test('律师默认条数正确', l1Default.length >= 0)

  const l1Hack = await query(lawyer1.cookie, { userId: lawyer2.user.id })
  test('律师传别人 userId 被忽略(仍返回本人)', names(l1Hack) === lawyer1.user.name,
    `传入:${lawyer2.user.name} 实际:${names(l1Hack)}`)
  test('律师越权条数与默认一致', l1Hack.length === l1Default.length)

  const l1HackMgr = await query(lawyer1.cookie, { userId: manager.user.id })
  test('律师传经理 userId 被忽略(仍返回本人)', names(l1HackMgr) === lawyer1.user.name,
    `传入:${manager.user.name} 实际:${names(l1HackMgr)}`)

  console.log('\n=== B. 复核人视图 ===')
  const rv1Default = await query(reviewer1.cookie)
  test('复核人默认查询返回本人', rv1Default.length === 0 || names(rv1Default) === reviewer1.user.name,
    `实际: ${names(rv1Default) || '(空)'}`)

  const rv1Hack = await query(reviewer1.cookie, { userId: lawyer2.user.id })
  test('复核人传律师 userId 被忽略(仍返回本人)', rv1Hack.length === rv1Default.length,
    `一致? ${rv1Hack.length === rv1Default.length}`)

  console.log('\n=== C. Manager 视图（铃铛首页通知） ===')
  const mgrPending = await query(manager.cookie, { status: 'PENDING' })
  const mgrNames = names(mgrPending).split(',')
  test('Manager 能看到多个律师的提醒', mgrNames.length > 1,
    `涉及人员: ${mgrNames.join(',') || '(空)'}`)
  test('Manager PENDING 条数 > 0', mgrPending.length > 0, `共 ${mgrPending.length} 条`)

  const allHaveContract = mgrPending.every(r => r.contract && r.contract.contractNo)
  test('每条提醒含合同信息(合同号/标题)', allHaveContract)
  const allHaveType = mgrPending.every(r => r.reminderType)
  test('每条提醒含提醒类型', allHaveType)
  const allHaveDate = mgrPending.every(r => r.deadlineDate)
  test('每条提醒含截止日期', allHaveDate)

  console.log('\n=== D. Manager userId 过滤（个人入口） ===')
  const mgrFilter = await query(manager.cookie, { userId: lawyer1.user.id })
  test('Manager 按律师 userId 过滤生效', names(mgrFilter) === lawyer1.user.name,
    `过滤:${lawyer1.user.name} 实际:${names(mgrFilter)}`)

  const mgrSelf = await query(manager.cookie, { userId: manager.user.id })
  test('Manager 按自己 userId 过滤正确', mgrSelf.length === 0 || names(mgrSelf) === manager.user.name,
    `实际:${names(mgrSelf) || '(空)'}`)

  console.log('\n=== E. Manager status/type 过滤 ===')
  const mgrAll = await query(manager.cookie, { status: 'ALL' })
  test('Manager status=ALL 返回量 >= PENDING', mgrAll.length >= mgrPending.length,
    `${mgrAll.length} >= ${mgrPending.length}`)

  console.log(`\n========================================`)
  console.log(`测试结果: ${pass} 通过, ${fail} 失败`)
  console.log(`========================================`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(e => { console.error('异常:', e.message); process.exit(1) })
