import sys, os, inspect
sys.path.insert(0, '.')
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
os.environ['DB_HOST'] = '127.0.0.1'
os.makedirs('logs', exist_ok=True)
import django; django.setup()

checks_ok = []

print('=== 1. OrganizationScopedViewSet.get_queryset 无管理员豁免 ===')
from apps.viewsets import OrganizationScopedViewSet
src = inspect.getsource(OrganizationScopedViewSet.get_queryset)
print(src)
ok = 'is_admin' not in src
checks_ok.append(('viewsets: no admin bypass', ok))
print(f'==> {ok}\n')

print('=== 2. OrganizationScopedPermission.has_object_permission 无管理员豁免 ===')
from apps.permissions import OrganizationScopedPermission
src = inspect.getsource(OrganizationScopedPermission.has_object_permission)
print(src)
ok = 'is_admin' not in src
checks_ok.append(('permissions: no admin bypass', ok))
print(f'==> {ok}\n')

print('=== 3. NotificationRuleSerializer 同源映射 ===')
from apps.notifications.serializers import NotificationRuleSerializer
s = NotificationRuleSerializer()
et = s.fields['event_type']
tr = s.fields['trigger']
print(f'  event_type.read_only: {et.read_only} (want: False)')
print(f'  event_type.source: {et.source} (want: trigger)')
print(f'  trigger.required: {tr.required} (want: False)')
s1 = NotificationRuleSerializer(data={'name': 'test_et', 'event_type': 'alert_created', 'method': 'in_app'})
ok1 = s1.is_valid()
print(f'  Submit only event_type: {ok1}, trigger={s1.validated_data.get("trigger") if ok1 else s1.errors}')
s2 = NotificationRuleSerializer(data={'name': 'test_tr', 'trigger': 'inspection_failed', 'method': 'in_app'})
ok2 = s2.is_valid()
print(f'  Submit only trigger: {ok2}, trigger={s2.validated_data.get("trigger") if ok2 else s2.errors}')
ok = not et.read_only and et.source == 'trigger' and not tr.required and ok1 and ok2
checks_ok.append(('serializer: event_type/trigger mapping', ok))
print(f'==> {ok}\n')

print('=== 4. AuditLog/UserViewSet 无管理员豁免 org 过滤 ===')
from apps.audits.views import AuditLogViewSet
from apps.accounts.views import UserViewSet
for name, cls in [('AuditLogViewSet', AuditLogViewSet), ('UserViewSet', UserViewSet)]:
    src = inspect.getsource(cls.get_queryset)
    ok = 'is_admin' not in src
    print(f'  {name}: is_admin check absent? {ok}')
    checks_ok.append((f'{name}: no admin bypass', ok))
print()

print('=== SUMMARY ===')
all_ok = True
for label, ok in checks_ok:
    print(f'  [{"OK" if ok else "FAIL"}] {label}')
    if not ok:
        all_ok = False
print()
if all_ok:
    print('=== ALL CHECKS PASSED ===')
    sys.exit(0)
else:
    print('=== SOME CHECKS FAILED ===')
    sys.exit(1)
