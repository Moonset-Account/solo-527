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

async function main() {
  console.log('=== Test 1: Manager 登录 ===')
  const loginRes = await httpRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: { username: 'manager', password: '123456' }
  })
  console.log('Status:', loginRes.status)
  const loginData = JSON.parse(loginRes.body)
  if (loginData.error || loginData.statusCode) {
    console.log('Login error:', loginData.message || loginData.body)
    process.exit(1)
  }
  console.log('用户:', loginData.user?.name, '角色:', loginData.user?.role)
  const mgrCookie = extractSession(loginRes.cookies)
  console.log('Cookie:', mgrCookie ? '获取成功' : '失败')

  console.log('\n=== Test 2: Manager 查提醒 ===')
  const remRes = await httpRequest('http://localhost:3000/api/reminders?status=PENDING', {
    cookie: mgrCookie
  })
  console.log('Status:', remRes.status)
  const reminders = JSON.parse(remRes.body)
  if (reminders.error || reminders.statusCode) {
    console.log('Error:', reminders.message)
    process.exit(1)
  }
  console.log('Manager 可见提醒数:', reminders.length)
  const byUser = {}
  for (const r of reminders) {
    const k = `${r.user.name}(${r.user.role})`
    byUser[k] = (byUser[k] || 0) + 1
  }
  console.log('按人员分组:')
  for (const [k, v] of Object.entries(byUser).sort((a, b) => b[1] - a[1])) {
    console.log(' ', k, ':', v)
  }
  console.log('\n前5条详情:')
  for (const r of reminders.slice(0, 5)) {
    console.log(`  [${r.reminderType}] ${r.deadlineDate.slice(0,10)} | ${r.contract.contractNo} | 提醒:${r.user.name} | ${r.contract.title.slice(0,20)}`)
  }

  console.log('\n=== Test 3: 律师登录对比 ===')
  const lawRes = await httpRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: { username: 'lawyer1', password: '123456' }
  })
  const lawCookie = extractSession(lawRes.cookies)
  const lawRemRes = await httpRequest('http://localhost:3000/api/reminders', {
    cookie: lawCookie
  })
  const lawReminders = JSON.parse(lawRemRes.body)
  console.log('律师李思远可见提醒数:', lawReminders.length)
  if (lawReminders.length > 0) {
    console.log('被提醒人(应全是李思远):', [...new Set(lawReminders.map(r => r.user.name))].join(','))
  }

  console.log('\n✅ 测试完成')
}

main().catch(e => console.error('错误:', e.message))
