from django.db import models
from django.utils import timezone
from django.conf import settings
from apps.common.models import BaseModel
from apps.accounts.models import Family, User, Child
from apps.books.models import Theme, Book


class ActivityStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    PUBLISHED = 'published', '已发布'
    REGISTRATION_OPEN = 'registration_open', '报名中'
    REGISTRATION_CLOSED = 'registration_closed', '报名截止'
    IN_PROGRESS = 'in_progress', '进行中'
    COMPLETED = 'completed', '已完成'
    CANCELLED = 'cancelled', '已取消'


class RegistrationStatus(models.TextChoices):
    REGISTERED = 'registered', '已报名'
    WAITLISTED = 'waitlisted', '候补中'
    CONFIRMED = 'confirmed', '已确认'
    CANCELLED = 'cancelled', '已取消'
    ATTENDED = 'attended', '已参加'
    NO_SHOW = 'no_show', '已爽约'
    PROMOTED = 'promoted', '候补转正'


class Activity(BaseModel):
    title = models.CharField(max_length=200, verbose_name='活动标题')
    description = models.TextField(verbose_name='活动描述')
    cover = models.ImageField(upload_to='activities/covers/', blank=True, verbose_name='活动封面')
    activity_type = models.CharField(max_length=30, choices=[
        ('story_telling', '故事会'),
        ('handcraft', '手工活动'),
        ('reading', '读书会'),
        ('parenting', '育儿讲座'),
        ('other', '其他'),
    ], default='story_telling', verbose_name='活动类型')
    themes = models.ManyToManyField(Theme, related_name='activities', blank=True, verbose_name='关联主题')
    related_books = models.ManyToManyField(Book, related_name='activities', blank=True, verbose_name='关联绘本')
    age_min = models.IntegerField(default=2, verbose_name='最小年龄')
    age_max = models.IntegerField(default=8, verbose_name='最大年龄')
    max_participants = models.IntegerField(default=20, verbose_name='最大参与人数')
    waitlist_size = models.IntegerField(default=10, verbose_name='候补人数上限')
    location = models.CharField(max_length=100, verbose_name='活动地点')
    start_time = models.DateTimeField(verbose_name='开始时间')
    end_time = models.DateTimeField(verbose_name='结束时间')
    registration_start = models.DateTimeField(verbose_name='报名开始时间')
    registration_end = models.DateTimeField(verbose_name='报名截止时间')
    status = models.CharField(max_length=20, choices=ActivityStatus.choices, default=ActivityStatus.DRAFT, verbose_name='活动状态')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_activities', verbose_name='创建人')
    host = models.CharField(max_length=100, blank=True, verbose_name='主持人')
    requires_deposit = models.BooleanField(default=True, verbose_name='是否需要押金')
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='活动押金')
    points_required = models.IntegerField(default=0, verbose_name='需要积分')

    class Meta:
        db_table = 'activities_activity'
        verbose_name = '活动'
        verbose_name_plural = verbose_name
        ordering = ['-start_time']

    def __str__(self):
        return self.title

    @property
    def registered_count(self):
        return self.registrations.filter(
            status__in=[RegistrationStatus.REGISTERED, RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED],
            is_deleted=False
        ).count()

    @property
    def waitlist_count(self):
        return self.registrations.filter(
            status=RegistrationStatus.WAITLISTED,
            is_deleted=False
        ).count()

    @property
    def has_available_slots(self):
        return self.registered_count < self.max_participants

    @property
    def has_waitlist_slots(self):
        return self.waitlist_count < self.waitlist_size

    def get_next_waitlist_position(self):
        max_pos = self.registrations.filter(
            status=RegistrationStatus.WAITLISTED,
            is_deleted=False
        ).aggregate(models.Max('waitlist_position'))['waitlist_position__max'] or 0
        return max_pos + 1

    def promote_waitlist(self, count=1):
        waitlisted = self.registrations.filter(
            status=RegistrationStatus.WAITLISTED,
            is_deleted=False
        ).order_by('waitlist_position', 'created_at')[:count]
        
        promoted = []
        for reg in waitlisted:
            reg.status = RegistrationStatus.PROMOTED
            reg.promoted_at = timezone.now()
            reg.save()
            promoted.append(reg)
        
        self._reorder_waitlist()
        return promoted

    def _reorder_waitlist(self):
        waitlisted = self.registrations.filter(
            status=RegistrationStatus.WAITLISTED,
            is_deleted=False
        ).order_by('waitlist_position', 'created_at')
        
        for idx, reg in enumerate(waitlisted, 1):
            reg.waitlist_position = idx
            reg.save()


class ActivityRegistration(BaseModel):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='registrations', verbose_name='活动')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='activity_registrations', verbose_name='报名家庭')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='activity_registrations', verbose_name='参加儿童')
    registered_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_registrations', verbose_name='报名人')
    status = models.CharField(max_length=20, choices=RegistrationStatus.choices, default=RegistrationStatus.REGISTERED, verbose_name='报名状态')
    waitlist_position = models.IntegerField(default=0, verbose_name='候补位置')
    registered_at = models.DateTimeField(auto_now_add=True, verbose_name='报名时间')
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name='取消时间')
    promoted_at = models.DateTimeField(null=True, blank=True, verbose_name='候补转正时间')
    attended_at = models.DateTimeField(null=True, blank=True, verbose_name='签到时间')
    deposit_paid = models.BooleanField(default=False, verbose_name='押金已支付')
    deposit_refunded = models.BooleanField(default=False, verbose_name='押金已退还')
    notes = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'activities_registration'
        verbose_name = '活动报名'
        verbose_name_plural = verbose_name
        unique_together = ['activity', 'child']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.child.name} - {self.activity.title}'

    def can_register(self):
        if self.activity.status not in [ActivityStatus.REGISTRATION_OPEN, ActivityStatus.PUBLISHED]:
            return False, '活动未开放报名'
        
        if self.child.age < self.activity.age_min or self.child.age > self.activity.age_max:
            return False, f'儿童年龄不符合要求，需要{self.activity.age_min}-{self.activity.age_max}岁'
        
        if self.activity.requires_deposit:
            from apps.deposits.models import Deposit
            deposit = Deposit.objects.filter(family=self.family, is_deleted=False).first()
            if not deposit or deposit.balance < self.activity.deposit_amount:
                return False, '押金余额不足'
        
        no_show_count = ActivityRegistration.objects.filter(
            family=self.family,
            status=RegistrationStatus.NO_SHOW,
            is_deleted=False
        ).count()
        if no_show_count >= settings.MAX_MISS_APPOINTMENTS:
            return False, '爽约次数过多，暂时无法报名'
        
        if self.activity.has_available_slots:
            return True, '报名成功'
        elif self.activity.has_waitlist_slots:
            return True, '已加入候补'
        else:
            return False, '活动名额已满，候补也已满'

    def register(self):
        can, msg = self.can_register()
        if not can:
            raise ValueError(msg)
        
        if self.activity.has_available_slots:
            self.status = RegistrationStatus.REGISTERED
        else:
            self.status = RegistrationStatus.WAITLISTED
            self.waitlist_position = self.activity.get_next_waitlist_position()
        
        if self.activity.requires_deposit and self.activity.deposit_amount > 0:
            from apps.deposits.models import Deposit, DepositTransaction
            deposit = Deposit.objects.get(family=self.family)
            deposit.freeze(self.activity.deposit_amount, f'活动报名冻结: {self.activity.title}')
            self.deposit_paid = True
        
        self.save()
        return self

    def cancel(self):
        if self.status in [RegistrationStatus.CANCELLED, RegistrationStatus.ATTENDED]:
            raise ValueError('该报名已取消或已完成')
        
        if self.deposit_paid and not self.deposit_refunded:
            from apps.deposits.models import Deposit
            deposit = Deposit.objects.get(family=self.family)
            deposit.unfreeze(self.activity.deposit_amount, f'活动取消退还: {self.activity.title}')
            self.deposit_refunded = True
        
        was_waitlisted = self.status == RegistrationStatus.WAITLISTED
        self.status = RegistrationStatus.CANCELLED
        self.cancelled_at = timezone.now()
        self.save()
        
        if not was_waitlisted:
            self.activity.promote_waitlist(1)
        else:
            self.activity._reorder_waitlist()
        
        return self

    def mark_attended(self):
        self.status = RegistrationStatus.ATTENDED
        self.attended_at = timezone.now()
        
        if self.deposit_paid and not self.deposit_refunded:
            from apps.deposits.models import Deposit
            deposit = Deposit.objects.get(family=self.family)
            deposit.unfreeze(self.activity.deposit_amount, f'活动参加退还: {self.activity.title}')
            self.deposit_refunded = True
        
        self.save()
        return self

    def mark_no_show(self):
        self.status = RegistrationStatus.NO_SHOW
        
        if self.deposit_paid and not self.deposit_refunded:
            from apps.deposits.models import Deposit, DepositTransaction
            deposit = Deposit.objects.get(family=self.family)
            deposit.deduct(self.activity.deposit_amount, f'活动爽约扣除: {self.activity.title}')
            self.deposit_refunded = True
        
        self.save()
        return self


class ActivityWaitlistNotification(BaseModel):
    registration = models.ForeignKey(ActivityRegistration, on_delete=models.CASCADE, related_name='notifications', verbose_name='报名记录')
    notification_type = models.CharField(max_length=20, choices=[
        ('promoted', '候补转正'),
        ('reminder', '活动提醒'),
        ('cancelled', '活动取消'),
    ], verbose_name='通知类型')
    message = models.TextField(verbose_name='通知内容')
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name='发送时间')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='已读时间')

    class Meta:
        db_table = 'activities_waitlist_notification'
        verbose_name = '活动通知'
        verbose_name_plural = verbose_name
