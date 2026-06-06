from django.test import TestCase
from django.contrib.auth.models import User
from members.models import Member, MemberRole
from activities.models import Activity, ActivityStatus, Registration, RegistrationStatus
from datetime import datetime, timedelta
from django.utils import timezone

class WaitlistPromotionTest(TestCase):
    """
    样例二：候补转正
    
    场景：
    1. 活动名额已满，后来报名的家长进入候补列表
    2. 当有已确认报名的家长取消时，候补第一位自动转正
    3. 系统自动更新候补排位
    """
    
    def setUp(self):
        self.librarian_user = User.objects.create_user(username='lib1', password='test123')
        self.librarian = Member.objects.create(
            user=self.librarian_user,
            role=MemberRole.LIBRARIAN,
            family_name='李馆员'
        )
        
        self.parents = []
        for i in range(5):
            user = User.objects.create_user(username=f'parent{i+1}', password='test123')
            member = Member.objects.create(
                user=user,
                role=MemberRole.PARENT,
                family_name=f'家长{i+1}',
                child_name=f'孩子{i+1}',
                child_age=5 + i
            )
            self.parents.append(member)
        
        self.activity = Activity.objects.create(
            title='周六故事会',
            description='本周故事会主题：海洋探险',
            activity_type='storytelling',
            start_time=timezone.now() + timedelta(days=3),
            end_time=timezone.now() + timedelta(days=3, hours=1),
            location='绘本馆活动室',
            max_capacity=3,
            status=ActivityStatus.UPCOMING
        )
    
    def test_activity_full_and_waitlist(self):
        """测试：活动名额满后，后续报名进入候补"""
        for i in range(3):
            reg, msg = self.activity.register(self.parents[i])
            self.assertIsNotNone(reg)
            self.assertEqual(reg.status, RegistrationStatus.CONFIRMED)
        
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.current_capacity, 3)
        self.assertFalse(self.activity.has_capacity())
        
        reg4, msg4 = self.activity.register(self.parents[3])
        self.assertIsNotNone(reg4)
        self.assertEqual(reg4.status, RegistrationStatus.WAITLIST)
        self.assertEqual(reg4.waitlist_position, 1)
        
        reg5, msg5 = self.activity.register(self.parents[4])
        self.assertIsNotNone(reg5)
        self.assertEqual(reg5.status, RegistrationStatus.WAITLIST)
        self.assertEqual(reg5.waitlist_position, 2)
        
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.waitlist_count, 2)
    
    def test_waitlist_promotion_on_cancel(self):
        """测试：取消已确认报名，候补第一位自动转正"""
        regs_confirmed = []
        for i in range(3):
            reg, _ = self.activity.register(self.parents[i])
            regs_confirmed.append(reg)
        
        reg4, _ = self.activity.register(self.parents[3])
        reg5, _ = self.activity.register(self.parents[4])
        
        self.assertEqual(reg4.status, RegistrationStatus.WAITLIST)
        self.assertEqual(reg4.waitlist_position, 1)
        
        success = self.activity.cancel_registration(regs_confirmed[0])
        self.assertTrue(success)
        
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.current_capacity, 3)
        
        reg4.refresh_from_db()
        self.assertEqual(reg4.status, RegistrationStatus.CONFIRMED)
        self.assertIsNone(reg4.waitlist_position)
        
        reg5.refresh_from_db()
        self.assertEqual(reg5.status, RegistrationStatus.WAITLIST)
        self.assertEqual(reg5.waitlist_position, 1)
        
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.waitlist_count, 1)
    
    def test_multiple_promotions(self):
        """测试：多次取消，候补依次转正"""
        regs_confirmed = []
        for i in range(3):
            reg, _ = self.activity.register(self.parents[i])
            regs_confirmed.append(reg)
        
        reg4, _ = self.activity.register(self.parents[3])
        reg5, _ = self.activity.register(self.parents[4])
        
        parent6_user = User.objects.create_user(username='parent6', password='test123')
        parent6 = Member.objects.create(
            user=parent6_user,
            role=MemberRole.PARENT,
            family_name='家长6',
            child_name='孩子6'
        )
        reg6, _ = self.activity.register(parent6)
        
        self.activity.cancel_registration(regs_confirmed[0])
        self.activity.cancel_registration(regs_confirmed[1])
        
        reg4.refresh_from_db()
        reg5.refresh_from_db()
        reg6.refresh_from_db()
        
        self.assertEqual(reg4.status, RegistrationStatus.CONFIRMED)
        self.assertEqual(reg5.status, RegistrationStatus.CONFIRMED)
        self.assertEqual(reg6.status, RegistrationStatus.WAITLIST)
        self.assertEqual(reg6.waitlist_position, 1)
        
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.current_capacity, 3)
        self.assertEqual(self.activity.waitlist_count, 1)
    
    def test_cancel_waitlist_reorder(self):
        """测试：取消候补，排位自动调整"""
        for i in range(3):
            self.activity.register(self.parents[i])
        
        reg4, _ = self.activity.register(self.parents[3])
        reg5, _ = self.activity.register(self.parents[4])
        
        parent6_user = User.objects.create_user(username='parent6', password='test123')
        parent6 = Member.objects.create(
            user=parent6_user,
            role=MemberRole.PARENT,
            family_name='家长6'
        )
        reg6, _ = self.activity.register(parent6)
        
        self.assertEqual(reg4.waitlist_position, 1)
        self.assertEqual(reg5.waitlist_position, 2)
        self.assertEqual(reg6.waitlist_position, 3)
        
        self.activity.cancel_registration(reg4)
        
        reg5.refresh_from_db()
        reg6.refresh_from_db()
        
        self.assertEqual(reg5.waitlist_position, 1)
        self.assertEqual(reg6.waitlist_position, 2)
        
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.waitlist_count, 2)
    
    def test_complete_waitlist_scenario(self):
        """完整的候补转正场景演示"""
        print("\n=== 样例二测试开始：候补转正 ===")
        print(f"活动: {self.activity.title}")
        print(f"最大名额: {self.activity.max_capacity}")
        print()
        
        print("--- 步骤1: 前3位家长报名成功 ---")
        regs = []
        for i in range(3):
            reg, msg = self.activity.register(self.parents[i])
            regs.append(reg)
            print(f"  {self.parents[i].family_name}: {msg}")
        
        self.activity.refresh_from_db()
        print(f"  当前报名人数: {self.activity.current_capacity}/{self.activity.max_capacity}")
        print()
        
        print("--- 步骤2: 第4、5位家长报名，进入候补 ---")
        reg4, msg4 = self.activity.register(self.parents[3])
        print(f"  {self.parents[3].family_name}: {msg4}")
        
        reg5, msg5 = self.activity.register(self.parents[4])
        print(f"  {self.parents[4].family_name}: {msg5}")
        
        self.activity.refresh_from_db()
        print(f"  候补人数: {self.activity.waitlist_count}")
        print()
        
        print("--- 步骤3: 家长1取消报名 ---")
        self.activity.cancel_registration(regs[0])
        print(f"  {self.parents[0].family_name} 已取消报名")
        print()
        
        print("--- 步骤4: 候补自动转正结果 ---")
        reg4.refresh_from_db()
        reg5.refresh_from_db()
        self.activity.refresh_from_db()
        
        print(f"  {self.parents[3].family_name} 状态: {reg4.get_status_display()}" + 
              (" (已转正!)" if reg4.status == RegistrationStatus.CONFIRMED else ""))
        print(f"  {self.parents[4].family_name} 状态: {reg5.get_status_display()} (排位 {reg5.waitlist_position})")
        print(f"  当前报名人数: {self.activity.current_capacity}/{self.activity.max_capacity}")
        print(f"  候补人数: {self.activity.waitlist_count}")
        print("============================================\n")
