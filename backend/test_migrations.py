import os
import sys

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.conf import settings
settings.DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': '/tmp/test_dorm_repair.db',
}

import django
django.setup()

from django.core.management import call_command

print('Running migrate on SQLite...')
call_command('migrate', verbosity=1, interactive=False)
print()
print('All migrations applied successfully!')

from django.db import connections
with connections['default'].cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]
    print(f'\nTables created: {len(tables)}')
    for t in tables:
        print(f'  - {t}')

from apps.users.models import User, RoleConfig, Role
from apps.repairs.models import RepairRequest, RepairStatus
from apps.notifications.models import Notification, Announcement
from apps.audit.models import AuditLog
from apps.rooms.models import StudyRoom, Seat, SeatReservation, CheckInRecord
print('\nAll models imported successfully!')

call_command('init_data')

User.objects.create_user('teststudent', '123456', real_name='测试学生', role=Role.STUDENT, is_verified=True)
print('\nTest user created: teststudent / 123456')

print(f'\nTotal users: {User.objects.count()}')
print(f'Total role configs: {RoleConfig.objects.count()}')
print(f'Total study rooms: {StudyRoom.objects.count()}')
print(f'Total seats: {Seat.objects.count()}')

import os
if os.path.exists('/tmp/test_dorm_repair.db'):
    os.remove('/tmp/test_dorm_repair.db')
    print('\nCleaned up test database.')
