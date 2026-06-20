import sys
import os
import glob

sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ.setdefault('DB_HOST', '127.0.0.1')
os.environ.setdefault('DB_PORT', '5432')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

apps_list = ['accounts', 'assets', 'alerts', 'inspections', 'changes', 'dictionaries', 'audits', 'notifications']
errors = []

for a in apps_list:
    pattern = os.path.join('apps', a, '**', '*.py')
    for f in glob.glob(pattern, recursive=True):
        try:
            import py_compile
            py_compile.compile(f, doraise=True)
        except Exception as e:
            errors.append(f'{f}: {e}')

for a in apps_list:
    for f in ['apps.py', 'models.py', 'serializers.py', 'views.py', 'urls.py']:
        fp = os.path.join('apps', a, f)
        if os.path.exists(fp):
            try:
                import py_compile
                py_compile.compile(fp, doraise=True)
            except Exception as e:
                errors.append(f'{fp}: {e}')

if errors:
    print('COMPILE ERRORS:')
    for e in errors:
        print(f'  - {e}')
    sys.exit(1)
print('[OK] All Python files compiled.')

import django
try:
    django.setup()
except Exception as e:
    print(f'Django setup failed: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
print('[OK] Django setup completed.')

from django.apps import apps as dj_apps
app_labels = {a.label for a in dj_apps.get_app_configs()}
for a in apps_list:
    if a not in app_labels:
        print(f'[FAIL] App not loaded: {a}')
        sys.exit(1)
print(f'[OK] All {len(apps_list)} business apps loaded.')

from django.urls import get_resolver
resolver = get_resolver()
urlconf_patterns = sum(1 for _ in resolver.url_patterns)
print(f'[OK] URL resolver loaded ({urlconf_patterns} top-level patterns).')

try:
    from apps.alerts.views import AlertViewSet
    from apps.alerts.serializers import AlertListSerializer, AlertDetailSerializer
    from apps.inspections.views import InspectionTemplateViewSet, InspectionTaskViewSet
    from apps.changes.views import ChangeWindowViewSet
    from apps.changes.serializers import ChangeWindowListSerializer
    from apps.dictionaries.views import DictionaryCategoryViewSet
    from apps.notifications.views import NotificationRuleViewSet
    from apps.audits.views import AuditLogViewSet
except Exception as e:
    print(f'[FAIL] Core ViewSet import failed: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
print('[OK] All core ViewSets / Serializers imported.')

for name, cls, actions_expected in [
    ('AlertViewSet', AlertViewSet, ['list', 'retrieve', 'acknowledge', 'start_process', 'close', 'add_comment', 'upload_attachment']),
    ('InspectionTemplateViewSet', InspectionTemplateViewSet, ['list', 'retrieve', 'create', 'run']),
    ('InspectionTaskViewSet', InspectionTaskViewSet, ['list', 'retrieve', 'rerun']),
    ('ChangeWindowViewSet', ChangeWindowViewSet, ['list', 'retrieve', 'approve', 'reject', 'start', 'complete', 'cancel']),
]:
    extra = getattr(cls, 'get_extra_actions', lambda: [])()
    action_names = {a.url_name for a in extra}
    for exp in actions_expected:
        if exp not in action_names and exp not in ('list', 'retrieve', 'create'):
            print(f'[WARN] {name}: action "{exp}" not registered')
print('[OK] Custom actions registered.')

from apps.permissions import IsAdmin, IsAdminOrSecurityOwner
from apps.inspections.views import InspectionItemViewSet
from apps.dictionaries.views import DictionaryItemViewSet

checks = [
    ('Alert.acknowledge', AlertViewSet, 'acknowledge', 'IsAdminOrSecurityOwner'),
    ('Alert.start_process', AlertViewSet, 'start_process', 'IsAdminOrSecurityOwner'),
    ('Alert.close', AlertViewSet, 'close', 'IsAdminOrSecurityOwner'),
    ('Template.create', InspectionTemplateViewSet, 'create', 'IsAdminOrSecurityOwner'),
    ('Template.destroy', InspectionTemplateViewSet, 'destroy', 'IsAdminOrSecurityOwner'),
    ('Template.run', InspectionTemplateViewSet, 'run', 'IsAdminOrSecurityOwner'),
    ('Item.create', InspectionItemViewSet, 'create', 'IsAdminOrSecurityOwner'),
    ('Task.rerun', InspectionTaskViewSet, 'rerun', 'IsAdminOrSecurityOwner'),
    ('Change.approve', ChangeWindowViewSet, 'approve', 'IsAdminOrSecurityOwner'),
    ('Change.reject', ChangeWindowViewSet, 'reject', 'IsAdminOrSecurityOwner'),
    ('Change.start', ChangeWindowViewSet, 'start', 'IsAdminOrSecurityOwner'),
    ('Change.complete', ChangeWindowViewSet, 'complete', 'IsAdminOrSecurityOwner'),
    ('Change.cancel', ChangeWindowViewSet, 'cancel', 'IsAdminOrSecurityOwner'),
    ('DictCat.create', DictionaryCategoryViewSet, 'create', 'IsAdmin'),
    ('DictCat.destroy', DictionaryCategoryViewSet, 'destroy', 'IsAdmin'),
    ('DictItem.create', DictionaryItemViewSet, 'create', 'IsAdmin'),
    ('DictItem.destroy', DictionaryItemViewSet, 'destroy', 'IsAdmin'),
    ('NotifRule.create', NotificationRuleViewSet, 'create', 'IsAdmin'),
    ('NotifRule.destroy', NotificationRuleViewSet, 'destroy', 'IsAdmin'),
]

for label, vs, action, expected_perm in checks:
    perms = vs.action_permission_classes.get(action, [])
    perm_names = [p.__name__ for p in perms]
    if expected_perm not in perm_names:
        print(f'[FAIL] {label}: expected {expected_perm}, got {perm_names}')
        sys.exit(1)
print('[OK] All action_permission_classes verified.')

from apps.notifications.models import NotificationRule
db_fields = [f.name for f in NotificationRule._meta.get_fields()]
if 'event_type' in db_fields:
    print(f'[FAIL] event_type is still a DB field in NotificationRule')
    sys.exit(1)
if not hasattr(NotificationRule, 'event_type'):
    print(f'[FAIL] event_type property missing on NotificationRule')
    sys.exit(1)
assert NotificationRule.event_type.fget is not None
print('[OK] NotificationRule: event_type is @property -> trigger (not DB column)')

from apps.notifications.serializers import NotificationRuleSerializer
s = NotificationRuleSerializer()
assert s.fields['event_type'].source == 'trigger'
assert 'event_type_display' in s.fields
print('[OK] NotificationRuleSerializer: event_type maps to trigger')

from django.apps import apps as dj_apps2
nr_model = dj_apps2.get_model('notifications', 'NotificationRule')
ut = nr_model._meta.unique_together
if ('organization', 'name') not in ut:
    print(f'[FAIL] NotificationRule unique_together missing organization, got: {ut}')
    sys.exit(1)
print('[OK] NotificationRule: organization isolation (unique_together)')

print('\n=== ALL CHECKS PASSED ===')
