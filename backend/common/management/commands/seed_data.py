from datetime import date, time, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from children.models import ClassGroup, Child, ParentChildRelation, AuthorizedPickupPerson
from daily_records.models import DailyRecord, GrowthPhoto
from pickup.models import PickupRecord
from notifications.models import Notification
from finance.models import FeeItem, Payment, LeaveRequest
from common.audit import log_audit

User = get_user_model()


class Command(BaseCommand):
    help = '生成托育中心演示数据'

    def handle(self, *args, **options):
        self.stdout.write('开始生成演示数据...')

        users = self._create_users()
        classes = self._create_classes(users)
        children = self._create_children(classes)
        self._create_parent_relations(users, children)
        self._create_authorized_pickups(children)
        self._create_daily_records(children, users)
        self._create_pickup_records(children, users)
        self._create_notifications(users, classes)
        self._create_finance_data(children)
        self._create_leave_requests(children, users)

        self.stdout.write(self.style.SUCCESS('演示数据生成完成!'))
        self._print_accounts(users)

    def _create_users(self):
        self.stdout.write('  创建用户...')
        admin = User.objects.create_user('admin', password='admin123', role='admin',
                                         phone='13800000001', first_name='园长')
        teachers = [
            User.objects.create_user('teacher1', password='teacher123', role='teacher',
                                     phone='13800000011', first_name='王', last_name='老师'),
            User.objects.create_user('teacher2', password='teacher123', role='teacher',
                                     phone='13800000012', first_name='李', last_name='老师'),
        ]
        parents = [
            User.objects.create_user('parent1', password='parent123', role='parent',
                                     phone='13900000001', first_name='张', last_name='爸爸'),
            User.objects.create_user('parent2', password='parent123', role='parent',
                                     phone='13900000002', first_name='刘', last_name='妈妈'),
            User.objects.create_user('parent3', password='parent123', role='parent',
                                     phone='13900000003', first_name='赵', last_name='奶奶'),
            User.objects.create_user('parent4', password='parent123', role='parent',
                                     phone='13900000004', first_name='陈', last_name='爸爸'),
        ]
        return {'admin': admin, 'teachers': teachers, 'parents': parents}

    def _create_classes(self, users):
        self.stdout.write('  创建班级...')
        c1 = ClassGroup.objects.create(name='向日葵班', grade='小班', teacher=users['teachers'][0])
        c2 = ClassGroup.objects.create(name='小星星班', grade='中班', teacher=users['teachers'][1])
        return [c1, c2]

    def _create_children(self, classes):
        self.stdout.write('  创建儿童档案...')
        data = [
            ('张小明', 'M', date(2022, 3, 15), classes[0], '花生过敏', '', '张伟', '13900000001'),
            ('刘思琪', 'F', date(2022, 7, 20), classes[0], '', '', '刘芳', '13900000002'),
            ('赵天宇', 'M', date(2021, 11, 8), classes[1], '牛奶过敏', '哮喘', '赵秀兰', '13900000003'),
            ('陈雨萱', 'F', date(2022, 1, 25), classes[1], '', '', '陈建国', '13900000004'),
            ('王子轩', 'M', date(2022, 5, 10), classes[0], '', '', '', ''),
            ('李诗涵', 'F', date(2021, 9, 3), classes[1], '鸡蛋过敏', '', '', ''),
        ]
        children = []
        for name, gender, birth, cls, allergy, medical, emerg, emerg_phone in data:
            children.append(Child.objects.create(
                name=name, gender=gender, birth_date=birth, class_group=cls,
                enrollment_date=date(2024, 9, 1), allergies=allergy, medical_notes=medical,
                emergency_contact=emerg, emergency_phone=emerg_phone,
            ))
        return children

    def _create_parent_relations(self, users, children):
        self.stdout.write('  创建家长-儿童关系...')
        relations = [
            (users['parents'][0], children[0], 'father', True),
            (users['parents'][1], children[1], 'mother', True),
            (users['parents'][2], children[2], 'grandmother', True),
            (users['parents'][3], children[3], 'father', True),
        ]
        for parent, child, relation, is_primary in relations:
            ParentChildRelation.objects.create(
                parent=parent, child=child, relation=relation, is_primary=is_primary
            )

    def _create_authorized_pickups(self, children):
        self.stdout.write('  创建授权接送人...')
        data = [
            (children[0], '张伟', '父亲', '320123199001011234', '13900000001'),
            (children[0], '张美玲', '姑姑', '320123199205052345', '13900000005'),
            (children[1], '刘芳', '母亲', '320123199203033456', '13900000002'),
            (children[1], '刘强', '舅舅', '320123198812124567', '13900000006'),
            (children[2], '赵秀兰', '奶奶', '320123195506065678', '13900000003'),
            (children[3], '陈建国', '父亲', '320123198807076789', '13900000004'),
        ]
        for child, name, relation, id_num, phone in data:
            AuthorizedPickupPerson.objects.create(
                child=child, name=name, relation=relation, id_number=id_num, phone=phone
            )

    def _create_daily_records(self, children, users):
        self.stdout.write('  创建每日记录...')
        today = date.today()
        teacher = users['teachers'][0]
        for i, child in enumerate(children[:4]):
            DailyRecord.objects.create(
                child=child, date=today,
                mood=['happy', 'calm', 'happy', 'fussy'][i],
                appetite=['good', 'normal', 'good', 'poor'][i],
                nap_start=time(12, 0), nap_end=time(14, 30),
                nap_quality=['好', '一般', '好', '差'][i],
                breakfast='牛奶+面包', lunch='米饭+鸡肉+蔬菜', snack='水果',
                activities='户外游戏、绘画、音乐课',
                recorded_by=teacher,
            )

    def _create_pickup_records(self, children, users):
        self.stdout.write('  创建接送记录...')
        now = timezone.now()
        today_morning = now.replace(hour=8, minute=30)
        PickupRecord.objects.create(
            child=children[0], direction='dropoff', actual_person_name='张伟',
            status='verified', verified_by=users['teachers'][0], pickup_time=today_morning,
        )
        PickupRecord.objects.create(
            child=children[1], direction='dropoff', actual_person_name='刘芳',
            status='verified', verified_by=users['teachers'][0],
            pickup_time=today_morning + timedelta(minutes=10),
        )
        PickupRecord.objects.create(
            child=children[2], direction='dropoff', actual_person_name='陌生人',
            status='pending', pickup_time=today_morning + timedelta(minutes=20),
        )

    def _create_notifications(self, users, classes):
        self.stdout.write('  创建通知...')
        Notification.objects.create(
            title='端午节放假通知', content='6月8日至6月10日放假3天，6月11日正常入园。',
            target_type='all', is_urgent=False, created_by=users['admin'],
        )
        Notification.objects.create(
            title='向日葵班亲子活动', content='本周六上午9点向日葵班举办亲子运动会，请家长准时参加。',
            target_type='class', target_class=classes[0], is_urgent=False,
            created_by=users['admin'],
        )
        Notification.objects.create(
            title='缴费提醒', content='您有一笔学费待缴纳，请尽快完成缴费。',
            target_type='individual', target_user=users['parents'][0], is_urgent=True,
            created_by=users['admin'],
        )

    def _create_finance_data(self, children):
        self.stdout.write('  创建缴费数据...')
        tuition = FeeItem.objects.create(
            name='2024年春季学费', fee_type='tuition', amount=5000.00,
            due_date=date(2024, 3, 31), is_active=True,
        )
        meal_fee = FeeItem.objects.create(
            name='2024年春季餐费', fee_type='meal', amount=1500.00,
            due_date=date(2024, 3, 31), is_active=True,
        )
        for child in children[:4]:
            Payment.objects.create(child=child, fee_item=tuition, amount=5000.00,
                                   status='pending', due_date=date(2024, 3, 31))
            Payment.objects.create(child=child, fee_item=meal_fee, amount=1500.00,
                                   status='paid', paid_amount=1500.00,
                                   paid_at=timezone.now() - timedelta(days=30),
                                   due_date=date(2024, 3, 31))

    def _create_leave_requests(self, children, users):
        self.stdout.write('  创建请假申请...')
        LeaveRequest.objects.create(
            child=children[0], requester=users['parents'][0],
            start_date=date.today() + timedelta(days=1),
            end_date=date.today() + timedelta(days=2),
            reason='家里有事需要请假',
        )
        LeaveRequest.objects.create(
            child=children[2], requester=users['parents'][2],
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=2),
            reason='感冒发烧需要休息',
            status='approved', reviewed_by=users['teachers'][1],
        )

    def _print_accounts(self, users):
        self.stdout.write('\n演示账号:')
        self.stdout.write('  管理员: admin / admin123')
        self.stdout.write('  教师1:  teacher1 / teacher123')
        self.stdout.write('  教师2:  teacher2 / teacher123')
        self.stdout.write('  家长1:  parent1 / parent123')
        self.stdout.write('  家长2:  parent2 / parent123')
        self.stdout.write('  家长3:  parent3 / parent123')
        self.stdout.write('  家长4:  parent4 / parent123')
