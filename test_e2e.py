import urllib.request, urllib.parse, urllib.error, http.cookiejar, re, sys

BASE = 'http://localhost:8080'

def get_session(username, password):
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    data = urllib.parse.urlencode({'username': username, 'password': password}).encode()
    req = urllib.request.Request(f'{BASE}/login', data=data, method='POST')
    resp = opener.open(req)
    sid = ''
    for c in jar:
        if c.name == 'session_id':
            sid = c.value
    print(f'  {username} session: {sid[:12]}...')
    return opener, sid

def fetch(opener, path, method='GET', data=None):
    try:
        if method == 'POST' and data is not None:
            body = urllib.parse.urlencode(data).encode() if isinstance(data, dict) else data
            if body is None:
                body = b''
            req = urllib.request.Request(f'{BASE}{path}', data=body, method='POST')
            req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        else:
            req = urllib.request.Request(f'{BASE}{path}', method='GET')
        resp = opener.open(req)
        body_text = resp.read().decode('utf-8', errors='ignore')
        return resp.status, len(body_text), body_text
    except urllib.error.HTTPError as e:
        try:
            msg = e.read().decode('utf-8', errors='ignore')
        except Exception:
            msg = str(e)
        return e.code, 0, msg
    except Exception as e:
        return 0, 0, str(e)[:200]

def find_order_with(opener, keyword):
    status, sz, html = fetch(opener, '/orders')
    if status != 200:
        return None
    m = re.findall(r'href="/orders/(\d+)/' + re.escape(keyword) + r'"', html)
    if m:
        return int(m[0])
    m = re.findall(r'/orders/(\d+)/' + re.escape(keyword), html)
    if m:
        return int(m[0])
    m = re.findall(r'/orders/(\d+)', html)
    if m:
        for mid in set(m):
            try:
                oid = int(mid)
            except:
                continue
            s2, _, h2 = fetch(opener, f'/orders/{oid}/{keyword}')
            if s2 == 200:
                return oid
    return None

def find_file_id(opener, oid):
    status, sz, html = fetch(opener, f'/orders/{oid}/download')
    if status != 200:
        return None
    m = re.findall(r'/api/files/(\d+)/download', html)
    if m:
        return int(m[0])
    m = re.findall(r'/api/orders/\d+/files/(\d+)/download', html)
    if m:
        return int(m[0])
    return None

def find_exception_pending(opener):
    status, sz, html = fetch(opener, '/exceptions')
    if status != 200:
        return None
    m = re.findall(r"handleException\((\d+)\)", html)
    if m:
        return int(m[0])
    return None

PASS = '✅'
FAIL = '❌'
report = []

print('\n=== A. 管理员登录 & 页面可访问 ===')
admin_opener, _ = get_session('admin', 'test123')
pages = ['/dashboard', '/orders', '/orders/1', '/orders/1/select', '/orders/1/download',
         '/trace/satisfaction', '/exceptions', '/admin', '/query/invoices', '/query/authorizations']
for p in pages:
    status, size, _ = fetch(admin_opener, p)
    ok = status == 200
    report.append((f'页面 {p}', ok, status))
    print(f'  {PASS if ok else FAIL} {status:3d}  {p}  ({size}b)')

print('\n=== B. 订单状态更新表单 ===')
status, _, preview = fetch(admin_opener, '/api/orders/1/status-form', method='POST',
    data={'status': 'delivered', 'remark': '测试状态更新：已交付'})
ok = status == 200 and '状态更新成功' in preview
report.append(('订单状态更新端点 /api/orders/1/status-form', ok, status))
print(f'  {PASS if ok else FAIL} {status:3d}  返回内容: "{preview[:90]}"')

print('\n=== C. 照片切换选中 ===')
# 找一个 admin 能访问到的有 select 页面的订单
select_oid = find_order_with(admin_opener, 'select') or 1
print(f'  找到有选片页的订单: #{select_oid}')
# 找 photos 目录里的任意一个 photo id —— 通过解析 select 页面
status, _, html = fetch(admin_opener, f'/orders/{select_oid}/select')
photo_ids = re.findall(r'data-photo-id="(\d+)"', html)
print(f'  订单 #{select_oid} 有 {len(photo_ids)} 张照片')
pid = photo_ids[0] if photo_ids else '1'
status, _, preview = fetch(admin_opener, f'/api/orders/{select_oid}/photos/{pid}/toggle', method='POST', data={'_': '1'})
# 只要不是 404/405 就认为OK（可能 302/422/500 也可能 200，我们看 status 不是方法不允许或路由不存在就行
ok = status in (200, 422)
report.append((f'单张切换 /api/orders/{select_oid}/photos/{pid}/toggle', status == 200, status))
print(f'  {PASS if status == 200 else FAIL} {status:3d}  返回内容: "{preview[:120]}"')

print('\n=== D. 批量切换选中 ===')
if len(photo_ids) >= 3:
    batch_data = {'photo_ids': ','.join(photo_ids[:3]), 'is_selected': 'true'}
    status, _, preview = fetch(admin_opener, f'/api/orders/{select_oid}/photos/batch', method='POST', data=batch_data)
    ok = status == 200
    report.append((f'批量切换 /api/orders/{select_oid}/photos/batch', ok, status))
    print(f'  {PASS if ok else FAIL} {status:3d}  返回内容: "{preview[:120]}"')
else:
    print('  ⚠️  没有足够的照片跳过批量测试')

print('\n=== E. 满意度追溯按参数筛选 ===')
query = urllib.parse.urlencode({'start_date': '2026-01-01', 'end_date': '2026-12-31', 'min_rating': '4', 'status': 'completed'})
status, size, _ = fetch(admin_opener, f'/trace/satisfaction?{query}')
ok = status == 200
report.append(('满意度追溯带参数筛选 GET', ok, status))
print(f'  {PASS if ok else FAIL} {status:3d}  /trace/satisfaction?筛选 ({size}b)')

print('\n=== F. 异常工单处理表单提交 ===')
tid = find_exception_pending(admin_opener) or 1
print(f'  找到待处理异常工单: #{tid}')
hd = {'status': 'resolved', 'result': '客户已安抚，退款已处理，电话回访确认', 'reason': '拍摄当天天气差导致延期', 'remark': '测试提交 by e2e'}
status, _, preview = fetch(admin_opener, f'/api/exceptions/{tid}/handle', method='POST', data=hd)
ok = status == 200 and '提交成功' in preview
report.append((f'异常处理 /api/exceptions/{tid}/handle', ok, status))
print(f'  {PASS if ok else FAIL} {status:3d}  返回内容: "{preview[:120]}"')

status, _, logs_prev = fetch(admin_opener, f'/api/exceptions/{tid}/logs')
ok = status == 200 and 'log-item' in logs_prev
report.append((f'异常日志 /api/exceptions/{tid}/logs', ok, status))
print(f'  {PASS if ok else FAIL} {status:3d}  日志内容: "{logs_prev[:120]}"')

print('\n=== G. 异常池按筛选查询 ===')
query = urllib.parse.urlencode({'type': 'price_diff', 'status': 'resolved', 'search': '测试'})
status, size, _ = fetch(admin_opener, f'/exceptions?{query}')
ok = status == 200
report.append(('异常池带参数筛选 GET', ok, status))
print(f'  {PASS if ok else FAIL} {status:3d}  /exceptions?筛选 ({size}b)')

print('\n=== H. 文件下载端点 ===')
dl_oid = find_order_with(admin_opener, 'download') or 1
print(f'  找到下载页的订单: #{dl_oid}')
fid = find_file_id(admin_opener, dl_oid)
if fid:
    print(f'  找到文件 id: {fid}')
    status, size, _ = fetch(admin_opener, f'/api/files/{fid}/download')
    ok = status == 200
    report.append((f'下载端点 /api/files/{fid}/download', ok, status))
    print(f'  {PASS if ok else FAIL} {status:3d}  /api/files/{fid}/download  ({size}b)')
else:
    print('  ⚠️  跳过下载测试（没有 delivery files）')

print('\n================= 结果汇总 =================')
passed = sum(1 for _, ok, __ in report if ok)
total = len(report)
for name, ok, st in report:
    print(f'  {PASS if ok else FAIL} {st:3d}  {name}')
print(f'\n总通过: {passed}/{total}')

# Open Preview for user
sys.exit(0 if passed == total else 1)
