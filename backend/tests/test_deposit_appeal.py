from django.test import TestCase
from django.contrib.auth.models import User
from members.models import Member, MemberRole
from deposits.models import DepositAccount, DepositTransaction, TransactionType, TransactionStatus

class DepositAppealTest(TestCase):
    """
    样例三：押金申诉
    
    场景：
    1. 系统扣减押金（如绘本破损赔偿），家长端需要确认
    2. 家长对扣减有异议，可以发起申诉
    3. 馆员处理申诉，可以通过并调整金额，或驳回
    """
    
    def setUp(self):
        self.librarian_user = User.objects.create_user(username='lib1', password='test123')
        self.librarian = Member.objects.create(
            user=self.librarian_user,
            role=MemberRole.LIBRARIAN,
            family_name='李馆员'
        )
        
        self.parent_user = User.objects.create_user(username='parent1', password='test123')
        self.parent = Member.objects.create(
            user=self.parent_user,
            role=MemberRole.PARENT,
            family_name='王家长',
            child_name='小明',
            child_age=5
        )
        
        self.account = DepositAccount.objects.create(
            member=self.parent,
            balance=200.00
        )
    
    def test_deposit_deduct_and_confirm(self):
        """测试：押金扣减流程"""
        transaction = self.account.add_transaction(
            amount=50,
            trans_type=TransactionType.DEDUCT,
            description='绘本破损赔偿'
        )
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, 150.00)
        self.assertEqual(transaction.status, TransactionStatus.PENDING)
        self.assertEqual(transaction.trans_type, TransactionType.DEDUCT)
        
        transaction.confirm()
        self.assertEqual(transaction.status, TransactionStatus.CONFIRMED)
    
    def test_deposit_appeal_flow(self):
        """测试：押金申诉完整流程"""
        transaction = self.account.add_transaction(
            amount=50,
            trans_type=TransactionType.DEDUCT,
            description='绘本内页涂鸦扣减'
        )
        transaction.confirm()
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, 150.00)
        self.assertEqual(transaction.status, TransactionStatus.CONFIRMED)
        
        appealed = self.account.appeal_transaction(
            transaction_id=transaction.id,
            appeal_reason='这本绘本借的时候就有涂鸦，不是我们弄的'
        )
        
        self.assertIsNotNone(appealed)
        self.assertEqual(appealed.status, TransactionStatus.APPEALING)
        self.assertEqual(appealed.appeal_reason, '这本绘本借的时候就有涂鸦，不是我们弄的')
    
    def test_appeal_approved_with_adjustment(self):
        """测试：申诉通过，调整金额"""
        transaction = self.account.add_transaction(
            amount=50,
            trans_type=TransactionType.DEDUCT,
            description='绘本破损扣减'
        )
        transaction.confirm()
        
        self.account.refresh_from_db()
        initial_balance = self.account.balance
        
        appealed = self.account.appeal_transaction(
            transaction.id,
            '轻微磨损不应该扣50'
        )
        
        success = appealed.resolve_appeal(
            approved=True,
            adjust_amount=30,
            result_note='经核实，确实是轻微磨损，退还30元'
        )
        
        self.assertTrue(success)
        self.assertEqual(appealed.status, TransactionStatus.CONFIRMED)
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, initial_balance + 30)
    
    def test_appeal_rejected(self):
        """测试：申诉被驳回"""
        transaction = self.account.add_transaction(
            amount=50,
            trans_type=TransactionType.DEDUCT,
            description='绘本撕毁扣减'
        )
        transaction.confirm()
        
        appealed = self.account.appeal_transaction(
            transaction.id,
            '不是我们撕的'
        )
        
        initial_balance = self.account.balance
        
        success = appealed.resolve_appeal(
            approved=False,
            adjust_amount=0,
            result_note='调取监控确认是孩子撕毁的，申诉驳回'
        )
        
        self.assertTrue(success)
        self.assertEqual(appealed.status, TransactionStatus.REJECTED)
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, initial_balance)
    
    def test_abnormal_deposit(self):
        """测试：押金余额不足时标记异常"""
        self.account.balance = 30
        self.account.save()
        
        transaction = self.account.add_transaction(
            amount=50,
            trans_type=TransactionType.DEDUCT,
            description='绘本丢失赔偿'
        )
        
        self.account.refresh_from_db()
        self.assertTrue(self.account.is_abnormal)
        self.assertEqual(self.account.abnormal_reason, '押金余额不足')
        self.assertEqual(self.account.balance, -20)
    
    def test_complete_appeal_scenario(self):
        """完整的押金申诉场景演示"""
        print("\n=== 样例三测试开始：押金申诉 ===")
        print(f"会员: {self.parent.family_name}")
        print(f"初始押金余额: {self.account.balance}元")
        print()
        
        print("--- 步骤1: 扣减押金 ---")
        transaction = self.account.add_transaction(
            amount=50,
            trans_type=TransactionType.DEDUCT,
            description='绘本《小恐龙》内页撕毁赔偿'
        )
        transaction.confirm()
        self.account.refresh_from_db()
        print(f"  扣减金额: 50元")
        print(f"  扣减原因: {transaction.description}")
        print(f"  当前余额: {self.account.balance}元")
        print()
        
        print("--- 步骤2: 家长发起申诉 ---")
        appealed = self.account.appeal_transaction(
            transaction.id,
            appeal_reason='借的时候就有小裂口，不是我们完全撕毁的'
        )
        print(f"  申诉内容: {appealed.appeal_reason}")
        print(f"  申诉状态: {appealed.get_status_display()}")
        print()
        
        print("--- 步骤3: 馆员处理申诉 ---")
        success = appealed.resolve_appeal(
            approved=True,
            adjust_amount=25,
            result_note='经核实确实原有小裂口，退还25元，仅扣25元'
        )
        print(f"  处理结果: 申诉通过")
        print(f"  处理说明: {appealed.appeal_result}")
        print(f"  调整金额: +25元")
        print()
        
        self.account.refresh_from_db()
        print("--- 最终结果 ---")
        print(f"  当前押金余额: {self.account.balance}元")
        print("============================================\n")
