from django.db import models
from django.conf import settings
from apps.core.models import BaseModel, User
from django.utils import timezone
from datetime import datetime


class MemberLevel(BaseModel):
    name = models.CharField(max_length=100, verbose_name='等级名称')
    level = models.IntegerField(unique=True, verbose_name='等级')
    min_points = models.IntegerField(default=0, verbose_name='最低积分')
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=1.00, verbose_name='折扣率')
    points_multiplier = models.DecimalField(max_digits=5, decimal_places=2, default=1.00, verbose_name='积分倍率')
    benefits = models.TextField(blank=True, verbose_name='权益说明')
    color = models.CharField(max_length=7, default='#000000', verbose_name='等级颜色')

    class Meta:
        db_table = 'member_level'
        verbose_name = '会员等级'
        verbose_name_plural = verbose_name
        ordering = ['level']

    def __str__(self):
        return self.name


class Member(BaseModel):
    GENDER_MALE = 'male'
    GENDER_FEMALE = 'female'
    GENDER_OTHER = 'other'
    
    GENDER_CHOICES = [
        (GENDER_MALE, '男'),
        (GENDER_FEMALE, '女'),
        (GENDER_OTHER, '其他'),
    ]
    
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_BLACKLIST = 'blacklist'
    
    STATUS_CHOICES = [
        (STATUS_ACTIVE, '正常'),
        (STATUS_INACTIVE, '停用'),
        (STATUS_BLACKLIST, '黑名单'),
    ]
    
    member_no = models.CharField(max_length=20, unique=True, verbose_name='会员编号')
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='member', verbose_name='关联用户')
    name = models.CharField(max_length=100, verbose_name='姓名')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, verbose_name='性别')
    birthday = models.DateField(null=True, blank=True, verbose_name='生日')
    phone = models.CharField(max_length=20, unique=True, verbose_name='手机号')
    email = models.EmailField(blank=True, verbose_name='邮箱')
    address = models.CharField(max_length=500, blank=True, verbose_name='地址')
    avatar = models.ImageField(upload_to='member_avatars/', blank=True, null=True, verbose_name='头像')
    level = models.ForeignKey(MemberLevel, on_delete=models.SET_NULL, null=True, related_name='members', verbose_name='会员等级')
    total_points = models.IntegerField(default=0, verbose_name='累计积分')
    available_points = models.IntegerField(default=0, verbose_name='可用积分')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, verbose_name='状态')
    register_date = models.DateTimeField(default=timezone.now, verbose_name='注册时间')
    expire_date = models.DateTimeField(null=True, blank=True, verbose_name='到期时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'member'
        verbose_name = '会员'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['member_no']),
            models.Index(fields=['phone']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.member_no} - {self.name}'
    
    def save(self, *args, **kwargs):
        if not self.member_no:
            today = datetime.now()
            prefix = today.strftime('%Y%m%d')
            last_member = Member.objects.filter(member_no__startswith=prefix).order_by('-member_no').first()
            if last_member:
                seq = int(last_member.member_no[-4:]) + 1
            else:
                seq = 1
            self.member_no = f'{prefix}{seq:04d}'
        
        if not self.level:
            self.level = MemberLevel.objects.filter(is_active=True).order_by('level').first()
        
        super().save(*args, **kwargs)


class PointsRecord(BaseModel):
    TYPE_EARN = 'earn'
    TYPE_CONSUME = 'consume'
    TYPE_EXPIRE = 'expire'
    TYPE_ADJUST = 'adjust'
    
    TYPE_CHOICES = [
        (TYPE_EARN, '获得积分'),
        (TYPE_CONSUME, '消耗积分'),
        (TYPE_EXPIRE, '积分过期'),
        (TYPE_ADJUST, '人工调整'),
    ]
    
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='points_records', verbose_name='会员')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='类型')
    points = models.IntegerField(verbose_name='积分数量')
    balance_after = models.IntegerField(verbose_name='变更后余额')
    source = models.CharField(max_length=200, blank=True, verbose_name='来源')
    related_id = models.IntegerField(null=True, blank=True, verbose_name='关联ID')
    expire_date = models.DateTimeField(null=True, blank=True, verbose_name='过期时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'points_record'
        verbose_name = '积分记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.member.name} - {self.get_type_display()}: {self.points}'


class ArrivalNotification(BaseModel):
    STATUS_PENDING = 'pending'
    STATUS_NOTIFIED = 'notified'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, '待通知'),
        (STATUS_NOTIFIED, '已通知'),
        (STATUS_CANCELLED, '已取消'),
    ]
    
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='notifications', verbose_name='会员')
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE, related_name='notifications', verbose_name='图书')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='状态')
    notified_at = models.DateTimeField(null=True, blank=True, verbose_name='通知时间')
    notify_method = models.CharField(max_length=50, default='sms', verbose_name='通知方式')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'arrival_notification'
        verbose_name = '到货通知'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.member.name} - {self.book.title}'
