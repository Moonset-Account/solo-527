from django.db import models
from members.models import Member

class TransactionType(models.TextChoices):
    DEPOSIT = 'deposit', '押金充值'
    DEDUCT = 'deduct', '押金扣减'
    REFUND = 'refund', '押金退还'
    APPEAL = 'appeal', '申诉调整'

class TransactionStatus(models.TextChoices):
    PENDING = 'pending', '待确认'
    CONFIRMED = 'confirmed', '已确认'
    REJECTED = 'rejected', '已拒绝'
    APPEALING = 'appealing', '申诉中'

class DepositAccount(models.Model):
    member = models.OneToOneField(Member, on_delete=models.CASCADE, related_name='deposit_account')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_abnormal = models.BooleanField(default=False)
    abnormal_reason = models.CharField(max_length=200, blank=True)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'deposit_accounts'

    def __str__(self):
        return f"{self.member.family_name} - 押金账户"

    def add_transaction(self, amount, trans_type, description='', related_borrow=None):
        if trans_type == TransactionType.DEDUCT:
            if self.balance < amount:
                self.is_abnormal = True
                self.abnormal_reason = '押金余额不足'
                self.save()
        elif trans_type in [TransactionType.DEPOSIT, TransactionType.REFUND, TransactionType.APPEAL]:
            pass
        
        transaction = DepositTransaction.objects.create(
            account=self,
            amount=amount,
            trans_type=trans_type,
            description=description,
            related_borrow=related_borrow
        )
        
        if trans_type == TransactionType.DEPOSIT:
            self.balance += amount
        elif trans_type == TransactionType.DEDUCT:
            self.balance -= amount
        elif trans_type == TransactionType.REFUND:
            self.balance += amount
        elif trans_type == TransactionType.APPEAL:
            self.balance += amount
        
        self.save()
        return transaction

    def appeal_transaction(self, transaction_id, appeal_reason):
        try:
            transaction = DepositTransaction.objects.get(id=transaction_id, account=self)
            if transaction.status == TransactionStatus.CONFIRMED:
                transaction.appeal_reason = appeal_reason
                transaction.status = TransactionStatus.APPEALING
                transaction.save()
                return transaction
            return None
        except DepositTransaction.DoesNotExist:
            return None

class DepositTransaction(models.Model):
    account = models.ForeignKey(DepositAccount, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    trans_type = models.CharField(max_length=20, choices=TransactionType.choices)
    status = models.CharField(max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.PENDING)
    description = models.CharField(max_length=200, blank=True)
    related_borrow = models.ForeignKey('borrows.Borrow', on_delete=models.SET_NULL, null=True, blank=True)
    appeal_reason = models.TextField(blank=True)
    appeal_result = models.TextField(blank=True)
    create_time = models.DateTimeField(auto_now_add=True)
    confirm_time = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'deposit_transactions'
        ordering = ['-create_time']

    def __str__(self):
        return f"{self.account.member.family_name} - {self.trans_type} - {self.amount}"

    def confirm(self):
        from django.utils import timezone
        self.status = TransactionStatus.CONFIRMED
        self.confirm_time = timezone.now()
        self.save()
        return True

    def reject(self, reject_reason=''):
        self.status = TransactionStatus.REJECTED
        self.appeal_result = reject_reason
        self.save()
        return True

    def resolve_appeal(self, approved, adjust_amount=0, result_note=''):
        if self.status != TransactionStatus.APPEALING:
            return False
        
        self.appeal_result = result_note
        if approved:
            self.status = TransactionStatus.CONFIRMED
            if adjust_amount != 0:
                self.account.balance += adjust_amount
                self.account.save()
        else:
            self.status = TransactionStatus.REJECTED
        self.save()
        return True
