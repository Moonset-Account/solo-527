import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from accounts.models import User
from children.models import Child

OK = '✅'
FAIL = '❌'

def get_client(username):
    user = User.objects.get(username=username)
    token, _ = Token.objects.get_or_create(user=user)
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return c, user

def test_endpoint(client, method, url, data=None, expected_status=None, label=''):
    if method == 'GET':
        resp = client.get(url)
    elif method == 'POST':
        resp = client.post(url, data, format='json')
    elif method == 'PUT':
        resp = client.put(url, data, format='json')
    elif method == 'PATCH':
        resp = client.patch(url, data, format='json')
    elif method == 'DELETE':
        resp = client.delete(url)
    else:
        resp = None

    passed = True
    if expected_status and resp.status_code != expected_status:
        passed = False

    icon = OK if passed else FAIL
    status_info = f'{resp.status_code}' if resp else 'N/A'
    expected_info = f'(expect {expected_status})' if expected_status else ''
    print(f'  {icon} {method} {url} → {status_info} {expected_info} {label}')
    return resp

print('=' * 70)
print('权限矩阵验证 - 三角色权限隔离测试')
print('=' * 70)

admin_client, admin_user = get_client('admin')
teacher_client, teacher_user = get_client('teacher1')
parent_client, parent_user = get_client('parent1')

# ============================================================
print('\n【1】用户管理 /api/accounts/users/')
print('  --- 管理员 ---')
test_endpoint(admin_client, 'GET', '/api/accounts/users/', expected_status=200, label='管理员列表用户')
test_endpoint(admin_client, 'POST', '/api/accounts/users/', data={'username': 'newtest', 'password': 'test123', 'role': 'teacher'}, expected_status=201, label='管理员创建用户')
test_endpoint(admin_client, 'PATCH', '/api/accounts/users/1/', data={'phone': '13800000001'}, expected_status=200, label='管理员编辑用户')

print('  --- 教师 ---')
test_endpoint(teacher_client, 'GET', '/api/accounts/users/', expected_status=403, label='教师列表用户(应拒绝)')
test_endpoint(teacher_client, 'POST', '/api/accounts/users/', data={'username': 'hack1', 'password': 'hack123', 'role': 'admin'}, expected_status=403, label='教师创建用户(应拒绝)')
test_endpoint(teacher_client, 'PATCH', '/api/accounts/users/1/', data={'phone': '000'}, expected_status=403, label='教师编辑用户(应拒绝)')

print('  --- 家长 ---')
test_endpoint(parent_client, 'GET', '/api/accounts/users/', expected_status=403, label='家长列表用户(应拒绝)')
test_endpoint(parent_client, 'POST', '/api/accounts/users/', data={'username': 'hack2', 'password': 'hack123', 'role': 'admin'}, expected_status=403, label='家长创建用户(应拒绝)')
test_endpoint(parent_client, 'PATCH', '/api/accounts/users/1/', data={'phone': '000'}, expected_status=403, label='家长编辑用户(应拒绝)')

# ============================================================
print('\n【2】儿童档案 /api/children/')
print('  --- 管理员 ---')
test_endpoint(admin_client, 'GET', '/api/children/', expected_status=200, label='管理员列表儿童')
test_endpoint(admin_client, 'POST', '/api/children/', data={'name': '测试儿童', 'gender': 'M', 'birth_date': '2022-01-01'}, expected_status=201, label='管理员创建儿童')

print('  --- 教师 ---')
test_endpoint(teacher_client, 'GET', '/api/children/', expected_status=200, label='教师列表儿童(本班)')
test_endpoint(teacher_client, 'POST', '/api/children/', data={'name': '教师添加', 'gender': 'F', 'birth_date': '2022-06-01'}, expected_status=201, label='教师创建儿童')

print('  --- 家长 ---')
test_endpoint(parent_client, 'GET', '/api/children/', expected_status=200, label='家长列表儿童(仅自己孩子)')
test_endpoint(parent_client, 'POST', '/api/children/', data={'name': '家长添加', 'gender': 'M', 'birth_date': '2022-03-01'}, expected_status=403, label='家长创建儿童(应拒绝)')

child_detail = Child.objects.first()
if child_detail:
    test_endpoint(parent_client, 'PUT', f'/api/children/{child_detail.pk}/', data={'name': '被改', 'gender': 'M', 'birth_date': '2022-01-01'}, expected_status=403, label='家长编辑儿童(应拒绝)')

# ============================================================
print('\n【3】接送核验 /api/pickup/')
print('  --- 管理员 ---')
test_endpoint(admin_client, 'GET', '/api/pickup/', expected_status=200, label='管理员列表接送')
test_endpoint(admin_client, 'POST', '/api/pickup/', data={'child': 1, 'direction': 'dropoff', 'actual_person_name': '张伟'}, expected_status=201, label='管理员创建接送')

print('  --- 教师 ---')
test_endpoint(teacher_client, 'GET', '/api/pickup/', expected_status=200, label='教师列表接送(本班)')
test_endpoint(teacher_client, 'POST', '/api/pickup/', data={'child': 1, 'direction': 'pickup', 'actual_person_name': '张伟'}, expected_status=201, label='教师创建接送')

print('  --- 家长 ---')
test_endpoint(parent_client, 'GET', '/api/pickup/', expected_status=200, label='家长列表接送(只读)')
test_endpoint(parent_client, 'POST', '/api/pickup/', data={'child': 1, 'direction': 'dropoff', 'actual_person_name': '测试'}, expected_status=403, label='家长创建接送(应拒绝)')

# ============================================================
print('\n【4】每日记录 /api/daily-records/')
print('  --- 管理员 ---')
test_endpoint(admin_client, 'GET', '/api/daily-records/', expected_status=200, label='管理员列表记录')
test_endpoint(admin_client, 'POST', '/api/daily-records/', data={'child': 1, 'date': '2025-01-01', 'mood': 'happy'}, expected_status=201, label='管理员创建记录')

print('  --- 教师 ---')
test_endpoint(teacher_client, 'GET', '/api/daily-records/', expected_status=200, label='教师列表记录')
test_endpoint(teacher_client, 'POST', '/api/daily-records/', data={'child': 1, 'date': '2025-06-01', 'mood': 'calm'}, expected_status=201, label='教师创建记录')

print('  --- 家长 ---')
test_endpoint(parent_client, 'GET', '/api/daily-records/', expected_status=200, label='家长列表记录(只读)')
test_endpoint(parent_client, 'POST', '/api/daily-records/', data={'child': 1, 'date': '2025-06-01', 'mood': 'happy'}, expected_status=403, label='家长创建记录(应拒绝)')

# ============================================================
print('\n【5】通知 /api/notifications/')
print('  --- 管理员 ---')
test_endpoint(admin_client, 'GET', '/api/notifications/', expected_status=200, label='管理员列表通知')
test_endpoint(admin_client, 'POST', '/api/notifications/', data={'title': '测试', 'content': '内容', 'target_type': 'all'}, expected_status=201, label='管理员创建通知')

print('  --- 教师 ---')
test_endpoint(teacher_client, 'GET', '/api/notifications/', expected_status=200, label='教师列表通知')
test_endpoint(teacher_client, 'POST', '/api/notifications/', data={'title': '教师通知', 'content': '内容', 'target_type': 'class'}, expected_status=201, label='教师创建通知')

print('  --- 家长 ---')
test_endpoint(parent_client, 'GET', '/api/notifications/', expected_status=200, label='家长列表通知(只读)')
test_endpoint(parent_client, 'POST', '/api/notifications/', data={'title': '家长发', 'content': '内容', 'target_type': 'all'}, expected_status=403, label='家长创建通知(应拒绝)')

# ============================================================
print('\n【6】缴费 /api/finance/payments/')
print('  --- 管理员 ---')
test_endpoint(admin_client, 'GET', '/api/finance/payments/', expected_status=200, label='管理员列表缴费')
test_endpoint(admin_client, 'POST', '/api/finance/payments/', data={'child': 1, 'fee_item': 1, 'amount': '100.00', 'status': 'pending'}, expected_status=201, label='管理员创建缴费')

print('  --- 教师 ---')
test_endpoint(teacher_client, 'GET', '/api/finance/payments/', expected_status=200, label='教师列表缴费(只读)')
test_endpoint(teacher_client, 'POST', '/api/finance/payments/', data={'child': 1, 'fee_item': 1, 'amount': '100.00', 'status': 'pending'}, expected_status=403, label='教师创建缴费(应拒绝)')

print('  --- 家长 ---')
test_endpoint(parent_client, 'GET', '/api/finance/payments/', expected_status=200, label='家长列表缴费(只读)')
test_endpoint(parent_client, 'POST', '/api/finance/payments/', data={'child': 1, 'fee_item': 1, 'amount': '100.00', 'status': 'pending'}, expected_status=403, label='家长创建缴费(应拒绝)')

# ============================================================
print('\n【7】请假 /api/finance/leaves/')
print('  --- 家长 ---')
test_endpoint(parent_client, 'GET', '/api/finance/leaves/', expected_status=200, label='家长列表请假')
test_endpoint(parent_client, 'POST', '/api/finance/leaves/', data={'child': 1, 'start_date': '2025-07-01', 'end_date': '2025-07-02', 'reason': '家事'}, expected_status=201, label='家长创建请假')

print('  --- 教师(审批) ---')
test_endpoint(teacher_client, 'GET', '/api/finance/leaves/', expected_status=200, label='教师列表请假')

print('  --- 管理员(审批) ---')
test_endpoint(admin_client, 'GET', '/api/finance/leaves/', expected_status=200, label='管理员列表请假')

# ============================================================
print('\n【8】审计日志 /api/audit-log/')
test_endpoint(admin_client, 'GET', '/api/audit-log/', expected_status=200, label='管理员查看审计')
test_endpoint(teacher_client, 'GET', '/api/audit-log/', expected_status=403, label='教师查看审计(应拒绝)')
test_endpoint(parent_client, 'GET', '/api/audit-log/', expected_status=403, label='家长查看审计(应拒绝)')

# ============================================================
print('\n【9】收费项目 /api/finance/fee-items/')
test_endpoint(admin_client, 'GET', '/api/finance/fee-items/', expected_status=200, label='管理员列表收费')
test_endpoint(admin_client, 'POST', '/api/finance/fee-items/', data={'name': '测试费', 'fee_type': 'other', 'amount': '50.00'}, expected_status=201, label='管理员创建收费')
test_endpoint(teacher_client, 'GET', '/api/finance/fee-items/', expected_status=200, label='教师列表收费(只读)')
test_endpoint(teacher_client, 'POST', '/api/finance/fee-items/', data={'name': '教师费', 'fee_type': 'other', 'amount': '50.00'}, expected_status=403, label='教师创建收费(应拒绝)')
test_endpoint(parent_client, 'GET', '/api/finance/fee-items/', expected_status=200, label='家长列表收费(只读)')
test_endpoint(parent_client, 'POST', '/api/finance/fee-items/', data={'name': '家长费', 'fee_type': 'other', 'amount': '50.00'}, expected_status=403, label='家长创建收费(应拒绝)')

# ============================================================
print('\n【10】班级数据隔离验证')
admin_resp = admin_client.get('/api/children/')
admin_children = [c['name'] for c in admin_resp.data['results']]
teacher_resp = teacher_client.get('/api/children/')
teacher_children = [c['name'] for c in teacher_resp.data['results']]
parent_resp = parent_client.get('/api/children/')
parent_children = [c['name'] for c in parent_resp.data['results']]

print(f'  管理员可见儿童({len(admin_children)}): {admin_children}')
print(f'  教师1可见儿童({len(teacher_children)}): {teacher_children}')
print(f'  家长1可见儿童({len(parent_children)}): {parent_children}')

if len(teacher_children) < len(admin_children):
    print(f'  {OK} 教师看到儿童数少于管理员(班级隔离)')
else:
    print(f'  {FAIL} 教师看到儿童数等于管理员(隔离可能失败)')

if len(parent_children) <= 2:
    print(f'  {OK} 家长只看到自己孩子')
else:
    print(f'  {FAIL} 家长看到过多儿童')

print('\n' + '=' * 70)
print('权限矩阵验证完成!')
print('=' * 70)
