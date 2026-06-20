import sys, os
sys.path.insert(0, '.')
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
os.environ['DB_HOST'] = '127.0.0.1'
os.makedirs('logs', exist_ok=True)

import django
django.setup()

from apps.notifications.serializers import NotificationRuleSerializer
from apps.notifications.models import NotificationRule

s = NotificationRuleSerializer()
et = s.fields['event_type']
tr = s.fields['trigger']
print('event_type writable:', not et.read_only)
print('event_type source:', et.source)
print('trigger required:', tr.required)

s1 = NotificationRuleSerializer(data={'name': 't1', 'event_type': 'alert_created', 'method': 'in_app'})
ok1 = s1.is_valid()
print('event_type-only:', ok1, 'trigger=', s1.validated_data.get('trigger') if ok1 else s1.errors)

s2 = NotificationRuleSerializer(data={'name': 't2', 'trigger': 'alert_created', 'method': 'in_app'})
ok2 = s2.is_valid()
print('trigger-only:', ok2, 'trigger=', s2.validated_data.get('trigger') if ok2 else s2.errors)

s3 = NotificationRuleSerializer(data={'name': 't3', 'trigger': 'change_window_failed', 'event_type': 'change_window_failed', 'method': 'in_app'})
ok3 = s3.is_valid()
print('both-same:', ok3, 'trigger=', s3.validated_data.get('trigger') if ok3 else s3.errors)

s4 = NotificationRuleSerializer(data={'name': 't4', 'trigger': 'alert_created', 'event_type': 'change_window_failed', 'method': 'in_app'})
ok4 = s4.is_valid()
print('both-diff:', ok4, '(should be False)')

s5 = NotificationRuleSerializer(data={'name': 't5', 'method': 'in_app'})
ok5 = s5.is_valid()
print('neither:', ok5, '(should be False)')

from django.apps import apps
nr = apps.get_model('notifications', 'NotificationRule')
print('org isolation:', ('organization', 'name') in nr._meta.unique_together)

print('ALL DONE')
