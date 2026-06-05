from django.core.management.base import BaseCommand
from notifications.services import SMSService


class Command(BaseCommand):
    help = '发送明日预约患者的提醒短信'

    def handle(self, *args, **options):
        self.stdout.write('开始发送预约提醒短信...')
        count = SMSService.send_bulk_reminders()
        self.stdout.write(self.style.SUCCESS(f'成功发送 {count} 条提醒短信'))
