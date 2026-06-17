import urllib.request, urllib.parse

data = urllib.parse.urlencode({'username': 'admin', 'password': 'test123'}).encode()
req = urllib.request.Request('http://localhost:8080/login', data=data, method='POST')
try:
    resp = urllib.request.urlopen(req)
    cookie_header = resp.headers.get('Set-Cookie', '')
    sid = cookie_header.split('session_id=')[1].split(';')[0] if 'session_id=' in cookie_header else ''
    print(f'Admin session: {sid}')
    pages = ['/admin', '/trace/satisfaction', '/query/authorizations', '/orders/1', '/orders/1/select', '/orders/1/download', '/exceptions']
    for p in pages:
        try:
            req2 = urllib.request.Request(f'http://localhost:8080{p}')
            req2.add_header('Cookie', f'session_id={sid}')
            resp2 = urllib.request.urlopen(req2)
            print(f'{p} -> {resp2.status}')
        except urllib.error.HTTPError as e:
            print(f'{p} -> {e.code}')
        except Exception as e:
            print(f'{p} -> ERROR: {e}')
except Exception as e:
    print(f'Login error: {e}')
