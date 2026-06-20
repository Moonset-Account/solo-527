from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import Organization, User


class Command(BaseCommand):
    help = 'Initialize demo data for the OPS Ticket system'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Creating demo organization...')
        org, created = Organization.objects.get_or_create(
            code='DEMO',
            defaults={
                'name': '演示组织',
                'description': '演示用默认组织',
                'is_active': True,
            }
        )

        self.stdout.write('Creating admin user...')
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@demo.com',
                'real_name': '系统管理员',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'organization': org,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Admin user created (admin/admin123)'))
        else:
            self.stdout.write('Admin user already exists')

        self.stdout.write('Creating security owner user...')
        sec_user, created = User.objects.get_or_create(
            username='security',
            defaults={
                'email': 'security@demo.com',
                'real_name': '安全负责人',
                'role': 'security_owner',
                'is_staff': False,
                'is_superuser': False,
                'is_active': True,
                'organization': org,
            }
        )
        if created:
            sec_user.set_password('security123')
            sec_user.save()
            self.stdout.write(self.style.SUCCESS('Security owner user created (security/security123)'))

        self.stdout.write('Creating normal user...')
        normal_user, created = User.objects.get_or_create(
            username='user',
            defaults={
                'email': 'user@demo.com',
                'real_name': '普通用户',
                'role': 'normal',
                'is_staff': False,
                'is_superuser': False,
                'is_active': True,
                'organization': org,
            }
        )
        if created:
            normal_user.set_password('user123')
            normal_user.save()
            self.stdout.write(self.style.SUCCESS('Normal user created (user/user123)'))

        self.stdout.write(self.style.SUCCESS('Demo data initialized successfully'))
