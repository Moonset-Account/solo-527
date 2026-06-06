from django.test import TestCase
from django.contrib.auth.models import User
from books.models import Book, BookStatus
from members.models import Member, MemberRole
from borrows.models import Borrow, BorrowStatus
from datetime import timedelta
from django.utils import timezone

class BorrowModuleTest(TestCase):
    """借阅核销模块测试"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='test1', password='123')
        self.member = Member.objects.create(
            user=self.user,
            role=MemberRole.PARENT,
            family_name='测试家庭'
        )
        self.book = Book.objects.create(
            isbn='9780000000001',
            title='测试绘本',
            author='测试作者',
            status=BookStatus.AVAILABLE
        )
    
    def test_borrow_creation(self):
        """测试创建借阅记录"""
        self.assertTrue(self.book.can_borrow())
        
        borrow = Borrow.objects.create(
            book=self.book,
            member=self.member,
            due_date=timezone.now().date() + timedelta(days=14)
        )
        
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, BookStatus.BORROWED)
        self.assertEqual(borrow.status, BorrowStatus.BORROWED)
    
    def test_return_book(self):
        """测试归还绘本（借阅核销）"""
        borrow = Borrow.objects.create(
            book=self.book,
            member=self.member,
            due_date=timezone.now().date() + timedelta(days=14)
        )
        
        result = borrow.return_book()
        self.assertTrue(result)
        
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, BookStatus.AVAILABLE)
        self.assertEqual(borrow.status, BorrowStatus.RETURNED)
        self.assertIsNotNone(borrow.return_date)
    
    def test_renew_book(self):
        """测试续借"""
        borrow = Borrow.objects.create(
            book=self.book,
            member=self.member,
            due_date=timezone.now().date() + timedelta(days=14)
        )
        
        original_due = borrow.due_date
        result = borrow.renew()
        self.assertTrue(result)
        self.assertEqual(borrow.renew_count, 1)
        self.assertEqual(borrow.due_date, original_due + timedelta(days=14))
    
    def test_overdue_detection(self):
        """测试逾期检测"""
        borrow = Borrow.objects.create(
            book=self.book,
            member=self.member,
            due_date=timezone.now().date() - timedelta(days=1)
        )
        
        self.assertTrue(borrow.is_overdue())

class RepairModuleTest(TestCase):
    """修复状态模块测试"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='lib1', password='123')
        self.librarian = Member.objects.create(
            user=self.user,
            role=MemberRole.LIBRARIAN,
            family_name='馆员'
        )
        self.book = Book.objects.create(
            isbn='9780000000002',
            title='待修复绘本',
            author='作者',
            status=BookStatus.AVAILABLE
        )
    
    def test_repair_status_flow(self):
        """测试修复状态流转"""
        from repairs.models import RepairRecord, RepairStatus
        from books.models import DamageLevel
        
        repair = RepairRecord.objects.create(
            book=self.book,
            reporter=self.librarian,
            damage_level=DamageLevel.LIGHT,
            description='封面轻微划痕'
        )
        
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, BookStatus.DAMAGED)
        self.assertEqual(repair.status, RepairStatus.PENDING)
        
        result = repair.start_repair()
        self.assertTrue(result)
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, BookStatus.REPAIRING)
        self.assertEqual(repair.status, RepairStatus.REPAIRING)
        
        result = repair.complete_repair()
        self.assertTrue(result)
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, BookStatus.AVAILABLE)
        self.assertEqual(repair.status, RepairStatus.COMPLETED)

class MemberPermissionTest(TestCase):
    """会员权限模块测试"""
    
    def test_role_permissions(self):
        """测试角色权限判断"""
        user1 = User.objects.create_user(username='lib', password='123')
        librarian = Member.objects.create(
            user=user1,
            role=MemberRole.LIBRARIAN,
            family_name='馆员'
        )
        
        user2 = User.objects.create_user(username='par', password='123')
        parent = Member.objects.create(
            user=user2,
            role=MemberRole.PARENT,
            family_name='家长'
        )
        
        self.assertTrue(librarian.is_librarian())
        self.assertFalse(librarian.is_parent())
        
        self.assertTrue(parent.is_parent())
        self.assertFalse(parent.is_librarian())
