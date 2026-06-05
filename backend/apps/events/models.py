from django.db import models
from apps.core.models import BaseModel
from apps.members.models import Member
from django.utils import timezone


class EventType(BaseModel):
    name = models.CharField(max_length=100, verbose_name='活动类型')
    description = models.TextField(blank=True, verbose_name='描述')
    color = models.CharField(max_length=7, default='#1890ff', verbose_name='标签颜色')

    class Meta:
        db_table = 'event_type'
        verbose_name = '活动类型'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name


class Event(BaseModel):
    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_REGISTRATION_OPEN = 'registration_open'
    STATUS_REGISTRATION_CLOSED = 'registration_closed'
    STATUS_ONGOING = 'ongoing'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_PUBLISHED, '已发布'),
        (STATUS_REGISTRATION_OPEN, '报名中'),
        (STATUS_REGISTRATION_CLOSED, '报名截止'),
        (STATUS_ONGOING, '进行中'),
        (STATUS_COMPLETED, '已结束'),
        (STATUS_CANCELLED, '已取消'),
    ]
    
    title = models.CharField(max_length=300, verbose_name='活动标题')
    event_type = models.ForeignKey(EventType, on_delete=models.SET_NULL, null=True, related_name='events', verbose_name='活动类型')
    description = models.TextField(verbose_name='活动描述')
    cover_image = models.ImageField(upload_to='event_covers/', blank=True, null=True, verbose_name='封面图片')
    start_time = models.DateTimeField(verbose_name='开始时间')
    end_time = models.DateTimeField(verbose_name='结束时间')
    location = models.CharField(max_length=300, verbose_name='活动地点')
    host = models.CharField(max_length=200, blank=True, verbose_name='主办方')
    speaker = models.CharField(max_length=200, blank=True, verbose_name='主讲人')
    max_participants = models.IntegerField(default=50, verbose_name='最大人数')
    min_participants = models.IntegerField(default=0, verbose_name='最少人数')
    registered_count = models.IntegerField(default=0, verbose_name='已报名人数')
    checked_in_count = models.IntegerField(default=0, verbose_name='已签到人数')
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='活动费用')
    points_required = models.IntegerField(default=0, verbose_name='所需积分')
    points_reward = models.IntegerField(default=0, verbose_name='奖励积分')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_DRAFT, verbose_name='状态')
    registration_deadline = models.DateTimeField(null=True, blank=True, verbose_name='报名截止时间')
    cancellation_deadline = models.DateTimeField(null=True, blank=True, verbose_name='取消报名截止时间')
    related_books = models.ManyToManyField('books.Book', blank=True, related_name='events', verbose_name='相关图书')
    tags = models.CharField(max_length=500, blank=True, verbose_name='标签')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'event'
        verbose_name = '读书会活动'
        verbose_name_plural = verbose_name
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['start_time']),
        ]

    def __str__(self):
        return self.title
    
    @property
    def available_slots(self):
        return max(0, self.max_participants - self.registered_count)
    
    @property
    def is_registration_open(self):
        if self.status != self.STATUS_REGISTRATION_OPEN:
            return False
        if self.registration_deadline and timezone.now() > self.registration_deadline:
            return False
        if self.available_slots <= 0:
            return False
        return True


class EventRegistration(BaseModel):
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHECKED_IN = 'checked_in'
    STATUS_NO_SHOW = 'no_show'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, '待确认'),
        (STATUS_CONFIRMED, '已确认'),
        (STATUS_CANCELLED, '已取消'),
        (STATUS_CHECKED_IN, '已签到'),
        (STATUS_NO_SHOW, '未出席'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations', verbose_name='活动')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='event_registrations', verbose_name='会员')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='状态')
    registration_time = models.DateTimeField(default=timezone.now, verbose_name='报名时间')
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name='签到时间')
    payment_status = models.CharField(max_length=20, default='unpaid', verbose_name='支付状态')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='支付金额')
    points_used = models.IntegerField(default=0, verbose_name='使用积分')
    notes = models.TextField(blank=True, verbose_name='备注')
    qr_code = models.ImageField(upload_to='event_qr/', blank=True, null=True, verbose_name='签到二维码')

    class Meta:
        db_table = 'event_registration'
        verbose_name = '活动报名'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        unique_together = [['event', 'member']]

    def __str__(self):
        return f'{self.event.title} - {self.member.name}'


class EventTicket(BaseModel):
    registration = models.OneToOneField(EventRegistration, on_delete=models.CASCADE, related_name='ticket', verbose_name='报名记录')
    ticket_no = models.CharField(max_length=50, unique=True, verbose_name='票号')
    qr_code = models.ImageField(upload_to='tickets/', blank=True, null=True, verbose_name='二维码')
    issued_at = models.DateTimeField(default=timezone.now, verbose_name='出票时间')
    used_at = models.DateTimeField(null=True, blank=True, verbose_name='使用时间')

    class Meta:
        db_table = 'event_ticket'
        verbose_name = '活动门票'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.ticket_no
