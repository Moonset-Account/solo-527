from django.test import TestCase
from django.contrib.auth.models import User
from books.models import Book, BookStatus, DamageLevel
from members.models import Member, MemberRole
from borrows.models import Borrow, BorrowStatus
from repairs.models import RepairRecord, RepairStatus
from datetime import date, timedelta
from django.utils import timezone

class DamageBookCannotBorrowTest(TestCase):
    """
    样例一：破损绘本不能再次借出
    
    场景：
    1. 绘本归还时发现破损，馆员录入破损信息并上传照片
    2. 根据破损程度，系统自动决定是否暂停借出
    3. "影响阅读"和"需下架"级别的破损绘本不能被再次借阅
    """
    
    def setUp(self):
        self.librarian_user = User.objects.create_user(username='librarian1', password='test123')
        self.librarian = Member.objects.create(
            user=self.librarian_user,
            role=MemberRole.LIBRARIAN,
            family_name='李馆员',
            phone='13800000001'
        )
        
        self.parent_user = User.objects.create_user(username='parent1', password='test123')
        self.parent = Member.objects.create(
            user=self.parent_user,
            role=MemberRole.PARENT,
            family_name='王家长',
            phone='13800000002',
            child_name='小明',
            child_age=5
        )
        
        self.book_light = Book.objects.create(
            isbn='9787111000001',
            title='轻微磨损的绘本',
            author='作者A',
            publisher='出版社A',
            status=BookStatus.AVAILABLE
        )
        
        self.book_affect = Book.objects.create(
            isbn='9787111000002',
            title='影响阅读的绘本',
            author='作者B',
            publisher='出版社B',
            status=BookStatus.AVAILABLE
        )
        
        self.book_need_off = Book.objects.create(
            isbn='9787111000003',
            title='需要下架的绘本',
            author='作者C',
            publisher='出版社C',
            status=BookStatus.AVAILABLE
        )
    
    def test_light_damage_book_still_can_borrow_after_repair(self):
        """测试：轻微磨损的绘本，修复后可以借阅"""
        repair = RepairRecord.objects.create(
            book=self.book_light,
            reporter=self.librarian,
            damage_level=DamageLevel.LIGHT,
            description='封面有轻微划痕'
        )
        
        self.book_light.refresh_from_db()
        self.assertEqual(self.book_light.status, BookStatus.DAMAGED)
        self.assertFalse(self.book_light.can_borrow())
        
        repair.start_repair()
        repair.complete_repair()
        
        self.book_light.refresh_from_db()
        self.assertEqual(self.book_light.status, BookStatus.AVAILABLE)
        self.assertTrue(self.book_light.can_borrow())
    
    def test_affect_read_book_cannot_borrow(self):
        """测试：影响阅读的绘本自动下架，不能借阅"""
        repair = RepairRecord.objects.create(
            book=self.book_affect,
            reporter=self.librarian,
            damage_level=DamageLevel.AFFECT_READ,
            description='内页有多处涂鸦，影响阅读'
        )
        
        self.book_affect.refresh_from_db()
        self.assertEqual(self.book_affect.status, BookStatus.OFF_SHELF)
        self.assertFalse(self.book_affect.can_borrow())
        self.assertEqual(repair.status, RepairStatus.OFF_SHELF)
    
    def test_need_off_book_cannot_borrow(self):
        """测试：需下架的绘本自动下架，不能借阅"""
        repair = RepairRecord.objects.create(
            book=self.book_need_off,
            reporter=self.librarian,
            damage_level=DamageLevel.NEED_OFF,
            description='书脊断裂，严重破损'
        )
        
        self.book_need_off.refresh_from_db()
        self.assertEqual(self.book_need_off.status, BookStatus.OFF_SHELF)
        self.assertFalse(self.book_need_off.can_borrow())
        self.assertEqual(repair.status, RepairStatus.OFF_SHELF)
    
    def test_damaged_book_cannot_be_borrowed(self):
        """测试：尝试借阅破损或下架的绘本会失败"""
        RepairRecord.objects.create(
            book=self.book_affect,
            reporter=self.librarian,
            damage_level=DamageLevel.AFFECT_READ,
            description='内页涂鸦'
        )
        
        self.assertFalse(self.book_affect.can_borrow())
        
        try:
            borrow = Borrow.objects.create(
                book=self.book_affect,
                member=self.parent,
                due_date=timezone.now().date() + timedelta(days=14)
            )
            self.fail("应该无法创建借阅记录")
        except Exception:
            pass
    
    def test_return_and_mark_damaged_flow(self):
        """测试完整流程：借出 -> 归还时发现破损 -> 录入破损 -> 无法再次借阅"""
        book = Book.objects.create(
            isbn='9787111000004',
            title='测试完整流程的绘本',
            author='作者D',
            status=BookStatus.AVAILABLE
        )
        
        self.assertTrue(book.can_borrow())
        
        borrow = Borrow.objects.create(
            book=book,
            member=self.parent,
            due_date=timezone.now().date() + timedelta(days=14)
        )
        
        book.refresh_from_db()
        self.assertEqual(book.status, BookStatus.BORROWED)
        
        borrow.return_book()
        book.refresh_from_db()
        self.assertEqual(book.status, BookStatus.AVAILABLE)
        
        repair = RepairRecord.objects.create(
            book=book,
            reporter=self.librarian,
            borrow=borrow,
            damage_level=DamageLevel.AFFECT_READ,
            description='归还时发现内页被撕毁'
        )
        
        book.refresh_from_db()
        self.assertEqual(book.status, BookStatus.OFF_SHELF)
        self.assertFalse(book.can_borrow())
        
        print("\n=== 样例一测试完成：破损绘本不能再次借出 ===")
        print(f"绘本《{book.title}》状态: {book.get_status_display()}")
        print(f"是否可借阅: {book.can_borrow()}")
        print(f"破损程度: {repair.get_damage_level_display()}")
        print("============================================\n")
