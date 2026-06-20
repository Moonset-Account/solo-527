from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Initialize all demo data at once'

    def handle(self, *args, **options):
        from django.core.management import call_command

        self.stdout.write('Step 1: Creating demo users and organization...')
        call_command('init_demo_data')

        self.stdout.write('\nStep 2: Creating default dictionaries...')
        call_command('init_dictionaries')

        self.stdout.write(self.style.SUCCESS('\nAll initialization completed!'))
        self.stdout.write('Login credentials:')
        self.stdout.write('  admin    / admin123    (管理员)')
        self.stdout.write('  security / security123 (安全负责人)')
        self.stdout.write('  user     / user123     (普通用户)')
