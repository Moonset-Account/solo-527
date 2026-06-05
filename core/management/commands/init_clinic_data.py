from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import User, Department
from patients.models import ChronicDisease
from appointments.models import RescheduleReason


class Command(BaseCommand):
    help = '初始化诊所基础数据'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('开始初始化诊所数据...'))

        departments = [
            {'name': '内科', 'description': '内科诊疗', 'floor': '1楼'},
            {'name': '外科', 'description': '外科诊疗', 'floor': '1楼'},
            {'name': '心血管内科', 'description': '心血管疾病诊疗', 'floor': '2楼'},
            {'name': '内分泌科', 'description': '糖尿病、甲状腺等内分泌疾病', 'floor': '2楼'},
            {'name': '呼吸内科', 'description': '呼吸系统疾病', 'floor': '2楼'},
            {'name': '神经内科', 'description': '神经系统疾病', 'floor': '3楼'},
        ]

        for dept_data in departments:
            dept, created = Department.objects.get_or_create(
                name=dept_data['name'],
                defaults=dept_data
            )
            if created:
                self.stdout.write(f'  创建科室: {dept.name}')

        chronic_diseases = [
            {'name': '高血压', 'icd_code': 'I10'},
            {'name': '2型糖尿病', 'icd_code': 'E11'},
            {'name': '冠心病', 'icd_code': 'I25'},
            {'name': '慢性支气管炎', 'icd_code': 'J42'},
            {'name': '脑梗塞', 'icd_code': 'I63'},
            {'name': '高脂血症', 'icd_code': 'E78'},
            {'name': '甲状腺功能亢进', 'icd_code': 'E05'},
            {'name': '慢性胃炎', 'icd_code': 'K29'},
        ]

        for cd_data in chronic_diseases:
            cd, created = ChronicDisease.objects.get_or_create(
                name=cd_data['name'],
                defaults=cd_data
            )
            if created:
                self.stdout.write(f'  创建慢病: {cd.name}')

        reschedule_reasons = [
            {'category': 'DOCTOR_ABSENT', 'name': '医生临时停诊'},
            {'category': 'DOCTOR_ABSENT', 'name': '医生外出学习'},
            {'category': 'DOCTOR_ABSENT', 'name': '医生紧急会诊'},
            {'category': 'PATIENT_REQUEST', 'name': '患者身体不适'},
            {'category': 'PATIENT_REQUEST', 'name': '患者时间冲突'},
            {'category': 'PATIENT_REQUEST', 'name': '患者外出'},
            {'category': 'MEDICINE_SHORTAGE', 'name': '常用药缺货'},
            {'category': 'MEDICINE_SHORTAGE', 'name': '检查试剂不足'},
            {'category': 'OTHER', 'name': '天气原因'},
            {'category': 'OTHER', 'name': '系统维护'},
        ]

        for reason_data in reschedule_reasons:
            reason, created = RescheduleReason.objects.get_or_create(
                name=reason_data['name'],
                defaults=reason_data
            )
            if created:
                self.stdout.write(f'  创建改期原因: {reason.get_category_display()} - {reason.name}')

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@clinic.com',
                password='admin123456',
                role='ADMIN',
                first_name='系统',
                last_name='管理员'
            )
            self.stdout.write('  创建超级管理员: admin / admin123456')

        if not User.objects.filter(username='nurse01').exists():
            User.objects.create_user(
                username='nurse01',
                password='nurse123456',
                role='NURSE',
                first_name='王',
                last_name='护士',
                is_staff=True
            )
            self.stdout.write('  创建护士账号: nurse01 / nurse123456')

        if not User.objects.filter(username='doctor01').exists():
            User.objects.create_user(
                username='doctor01',
                password='doctor123456',
                role='DOCTOR',
                first_name='李',
                last_name='医生',
                is_staff=True
            )
            self.stdout.write('  创建医生账号: doctor01 / doctor123456')

        self.stdout.write(self.style.SUCCESS('初始化完成！'))
