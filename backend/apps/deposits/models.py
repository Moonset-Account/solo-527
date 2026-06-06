from django.db import models
from django.utils import timezone
from django.conf import settings
from apps.common.models import BaseModel
from apps.accounts.models import Family, User


class TransactionType(models.TextChoices):
    DEPOSIT = 'deposit', '充值'
    DEDUCT = 'deduct', '扣除'
    FREEZE = 'freeze', '冻结'
    UNFREEZE = 'unfreeze', '解冻'
    REFUND = 'refund', '退款'
    ADJUST = 'adjust', '调整'


class DepositStatus(models.TextChoices):
    ACTIVE = 'active', '正常'
    FROZEN = 'frozen', '冻结'
    CLOSED = 'closed', '已关闭'


class Deposit(BaseModel):
    family = models.OneToOneField(Family, on_delete=models.CASCADE, related_name='deposit', verbose_name='所属家庭')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='可用余额')
    frozen_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='冻结金额')
    total_deposited = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='累计充值')
    total_deducted = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='累计扣除')
    status = models.CharField(max_length=20, choices=DepositStatus.choices, default=DepositStatus.ACTIVE, verbose_name='账户状态')
    last_transaction_at = models.DateTimeField(null=True, blank=True, verbose_name='最后交易时间')

    class Meta:
        db_table = 'deposits_deposit'
        verbose_name = '押金账户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.family.name} - 押金账户'

    @property
    def total_balance(self):
        return self.balance + self.frozen_amount

    def recharge(self, amount, description='', operator=None):
        if amount <= 0:
            raise ValueError('充值金额必须大于0')
        
        self.balance += amount
        self.total_deposited += amount
        self.last_transaction_at = timezone.now()
        self.save()
        
        DepositTransaction.objects.create(
            deposit=self,
            transaction_type=TransactionType.DEPOSIT,
            amount=amount,
            balance_after=self.balance,
            frozen_after=self.frozen_amount,
            description=description,
            operator=operator
        )
        return self

    def deduct(self, amount, description='', operator=None, require_confirmation=True):
        if amount <= 0:
            raise ValueError('扣除金额必须大于0')
        if self.balance < amount:
            raise ValueError('可用余额不足')
        
        self.balance -= amount
        self.total_deducted += amount
        self.last_transaction_at = timezone.now()
        self.save()
        
        transaction = DepositTransaction.objects.create(
            deposit=self,
            transaction_type=TransactionType.DEDUCT,
            amount=amount,
            balance_after=self.balance,
            frozen_after=self.frozen_amount,
            description=description,
            operator=operator,
            needs_confirmation=require_confirmation
        )
        return transaction

    def freeze(self, amount, description='', operator=None):
        if amount <= 0:
            raise ValueError('冻结金额必须大于0')
        if self.balance < amount:
            raise ValueError('可用余额不足')
        
        self.balance -= amount
        self.frozen_amount += amount
        self.last_transaction_at = timezone.now()
        self.save()
        
        DepositTransaction.objects.create(
            deposit=self,
            transaction_type=TransactionType.FREEZE,
            amount=amount,
            balance_after=self.balance,
            frozen_after=self.frozen_amount,
            description=description,
            operator=operator
        )
        return self

    def unfreeze(self, amount, description='', operator=None):
        if amount <= 0:
            raise ValueError('解冻金额必须大于0')
        if self.frozen_amount < amount:
            raise ValueError('冻结金额不足')
        
        self.balance += amount
        self.frozen_amount -= amount
        self.last_transaction_at = timezone.now()
        self.save()
        
        DepositTransaction.objects.create(
            deposit=self,
            transaction_type=TransactionType.UNFREEZE,
            amount=amount,
            balance_after=self.balance,
            frozen_after=self.frozen_amount,
            description=description,
            operator=operator
        )
        return self

    def refund(self, amount, description='', operator=None):
        if amount <= 0:
            raise ValueError('退款金额必须大于0')
        
        self.balance += amount
        self.last_transaction_at = timezone.now()
        self.save()
        
        DepositTransaction.objects.create(
            deposit=self,
            transaction_type=TransactionType.REFUND,
            amount=amount,
            balance_after=self.balance,
            frozen_after=self.frozen_amount,
            description=description,
            operator=operator
        )
        return self


class DepositTransaction(BaseModel):
    deposit = models.ForeignKey(Deposit, on_delete=models.CASCADE, related_name='transactions', verbose_name='押金账户')
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices, verbose_name='交易类型')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='交易金额')
    balance_after = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='交易后可用余额')
    frozen_after = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='交易后冻结金额')
    description = models.CharField(max_length=255, blank=True, verbose_name='交易说明')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deposit_operations', verbose_name='操作人')
    needs_confirmation = models.BooleanField(default=False, verbose_name='是否需要确认')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_transactions', verbose_name='确认人')
    has_appeal = models.BooleanField(default=False, verbose_name='是否有申诉')

    class Meta:
        db_table = 'deposits_transaction'
        verbose_name = '押金交易记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.deposit.family.name} - {self.get_transaction_type_display()} - {self.amount}'

    def confirm(self, operator):
        if not self.needs_confirmation:
            raise ValueError('该交易不需要确认')
        if self.confirmed_at:
            raise ValueError('该交易已确认')
        
        self.confirmed_at = timezone.now()
        self.confirmed_by = operator
        self.save()
        return self


class DepositAppealStatus(models.TextChoices):
    PENDING = 'pending', '待处理'
    APPROVED = 'approved', '已通过'
    REJECTED = 'rejected', '已驳回'
    CLOSED = 'closed', '已关闭'


class DepositAppeal(BaseModel):
    transaction = models.ForeignKey(DepositTransaction, on_delete=models.CASCADE, related_name='appeals', verbose_name='关联交易')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='deposit_appeals', verbose_name='申诉家庭')
    appellant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deposit_appeals', verbose_name='申诉人')
    reason = models.TextField(verbose_name='申诉理由')
    evidence_images = models.JSONField(default=list, blank=True, verbose_name='凭证图片')
    status = models.CharField(max_length=20, choices=DepositAppealStatus.choices, default=DepositAppealStatus.PENDING, verbose_name='申诉状态')
    handler = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_appeals', verbose_name='处理人')
    handle_notes = models.TextField(blank=True, verbose_name='处理意见')
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='退款金额')

    class Meta:
        db_table = 'deposits_appeal'
        verbose_name = '押金申诉'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.family.name} - {self.get_status_display()}'

    def approve(self, handler, refund_amount=None, notes=''):
        if self.status != DepositAppealStatus.PENDING:
            raise ValueError('该申诉已处理')
        
        self.status = DepositAppealStatus.APPROVED
        self.handler = handler
        self.handle_notes = notes
        self.handled_at = timezone.now()
        
        if refund_amount is None:
            refund_amount = self.transaction.amount
        
        self.refund_amount = refund_amount
        
        if refund_amount > 0:
            self.transaction.deposit.refund(
                refund_amount,
                f'申诉退款: {self.reason[:50]}',
                operator=handler
            )
        
        self.save()
        return self

    def reject(self, handler, notes=''):
        if self.status != DepositAppealStatus.PENDING:
            raise ValueError('该申诉已处理')
        
        self.status = DepositAppealStatus.REJECTED
        self.handler = handler
        self.handle_notes = notes
        self.handled_at = timezone.now()
        self.save()
        return self
