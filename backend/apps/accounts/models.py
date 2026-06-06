from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.common.models import BaseModel
from django.utils import timezone


class Role(models.TextChoices):
    ADMIN = 'admin', '系统管理员'
    LIBRARIAN = 'librarian', '馆员'
    PARENT = 'parent', '家长'


class MemberLevel(models.TextChoices):
    BRONZE = 'bronze', '铜牌会员'
    SILVER = 'silver', '银牌会员'
    GOLD = 'gold', '金牌会员'
    PLATINUM = 'platinum', '铂金会员'


class MemberLevelConfig(BaseModel):
    level = models.CharField(max_length=20, choices=MemberLevel.choices, unique=True, verbose_name='会员等级')
    max_borrow_count = models.IntegerField(default=5, verbose_name='最大借阅数量')
    max_borrow_days = models.IntegerField(default=30, verbose_name='最大借阅天数')
    max_renew_count = models.IntegerField(default=1, verbose_name='最大续借次数')
    discount_rate = models.DecimalField(max_digits=3, decimal_places=2, default=1.0, verbose_name='折扣率')
    points_per_yuan = models.IntegerField(default=1, verbose_name='每元积分')
    require_deposit = models.BooleanField(default=True, verbose_name='是否需要押金')
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=200, verbose_name='押金金额')

    class Meta:
        db_table = 'accounts_member_level_config'
        verbose_name = '会员等级配置'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.get_level_display()


class User(AbstractUser, BaseModel):
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PARENT, verbose_name='角色')
    phone = models.CharField(max_length=11, blank=True, verbose_name='手机号')
    avatar = models.ImageField(upload_to='avatars/', blank=True, verbose_name='头像')
    points = models.IntegerField(default=0, verbose_name='积分')

    class Meta:
        db_table = 'accounts_user'
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'

    def add_points(self, points, description=''):
        self.points += points
        self.save()
        PointHistory.objects.create(
            user=self,
            points=points,
            balance_after=self.points,
            description=description
        )


class PointHistory(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='point_history', verbose_name='用户')
    points = models.IntegerField(verbose_name='积分变动')
    balance_after = models.IntegerField(verbose_name='变动后余额')
    description = models.CharField(max_length=255, blank=True, verbose_name='变动说明')

    class Meta:
        db_table = 'accounts_point_history'
        verbose_name = '积分记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.points:+d}'


class Family(BaseModel):
    name = models.CharField(max_length=100, verbose_name='家庭名称')
    address = models.CharField(max_length=255, blank=True, verbose_name='地址')
    primary_contact = models.ForeignKey(User, on_delete=models.CASCADE, related_name='primary_families', verbose_name='主联系人')
    members = models.ManyToManyField(User, related_name='families', blank=True, verbose_name='家庭成员')
    member_level = models.CharField(max_length=20, choices=MemberLevel.choices, default=MemberLevel.BRONZE, verbose_name='会员等级')
    level_expire_at = models.DateTimeField(null=True, blank=True, verbose_name='会员等级到期时间')
    total_borrow_count = models.IntegerField(default=0, verbose_name='累计借阅次数')
    no_show_count = models.IntegerField(default=0, verbose_name='累计爽约次数')

    class Meta:
        db_table = 'accounts_family'
        verbose_name = '家庭'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name

    @property
    def level_config(self):
        config = MemberLevelConfig.objects.filter(level=self.member_level, is_deleted=False).first()
        if not config:
            config = MemberLevelConfig.objects.filter(level=MemberLevel.BRONZE, is_deleted=False).first()
        return config

    @property
    def is_level_active(self):
        if not self.level_expire_at:
            return True
        return self.level_expire_at > timezone.now()

    def can_borrow_more(self):
        from apps.borrowing.models import BorrowRecord, BorrowStatus
        if not self.is_level_active:
            return False, '会员等级已过期'
        current_borrows = BorrowRecord.objects.filter(
            family=self,
            status__in=[BorrowStatus.BORROWED, BorrowStatus.OVERDUE, BorrowStatus.RESERVED, BorrowStatus.PICKED_UP],
            is_deleted=False
        ).count()
        max_count = self.level_config.max_borrow_count if self.level_config else 5
        if current_borrows >= max_count:
            return False, f'已达最大借阅数量 {max_count} 本'
        return True, '可以借阅'

    def increment_borrow_count(self):
        self.total_borrow_count += 1
        self.save()

    def increment_no_show(self):
        self.no_show_count += 1
        self.save()


class Child(BaseModel):
    GENDER_CHOICES = [
        ('male', '男孩'),
        ('female', '女孩'),
    ]
    
    name = models.CharField(max_length=50, verbose_name='姓名')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, verbose_name='性别')
    birth_date = models.DateField(verbose_name='出生日期')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='children', verbose_name='所属家庭')
    avatar = models.ImageField(upload_to='children/', blank=True, verbose_name='头像')

    class Meta:
        db_table = 'accounts_child'
        verbose_name = '儿童'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )
