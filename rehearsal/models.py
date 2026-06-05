from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
from datetime import timedelta


class Member(models.Model):
    ROLE_CHOICES = [
        ('director', '导演'),
        ('actor', '演员'),
        ('crew', '剧务'),
        ('admin', '管理员'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='用户')
    name = models.CharField(max_length=100, verbose_name='姓名')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name='角色')
    phone = models.CharField(max_length=20, blank=True, verbose_name='电话')
    email = models.EmailField(blank=True, verbose_name='邮箱')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '成员'
        verbose_name_plural = '成员'

    def __str__(self):
        return f'{self.name} ({self.get_role_display()})'

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_director(self):
        return self.role == 'director' or self.role == 'admin'


class Play(models.Model):
    STATUS_CHOICES = [
        ('preparing', '筹备中'),
        ('rehearsing', '排练中'),
        ('performing', '演出周'),
        ('completed', '已完成'),
    ]

    title = models.CharField(max_length=200, verbose_name='剧目名称')
    description = models.TextField(blank=True, verbose_name='剧目描述')
    director = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, related_name='directed_plays', verbose_name='导演')
    cast = models.ManyToManyField(Member, related_name='plays', blank=True, verbose_name='演员阵容')
    performance_date = models.DateField(null=True, blank=True, verbose_name='演出日期')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='preparing', verbose_name='状态')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '剧目'
        verbose_name_plural = '剧目'

    def __str__(self):
        return self.title

    def is_performance_week(self):
        if not self.performance_date:
            return False
        today = timezone.localdate()
        days_before = settings.PERFORMANCE_WEEK_DAYS_BEFORE
        start_date = self.performance_date - timedelta(days=days_before)
        return start_date <= today <= self.performance_date


class Room(models.Model):
    name = models.CharField(max_length=100, verbose_name='排练室名称')
    capacity = models.IntegerField(verbose_name='容纳人数')
    has_lighting = models.BooleanField(default=False, verbose_name='有灯光设备')
    has_sound = models.BooleanField(default=False, verbose_name='有音响设备')
    has_stage = models.BooleanField(default=False, verbose_name='有舞台')
    description = models.TextField(blank=True, verbose_name='描述')
    is_available = models.BooleanField(default=True, verbose_name='可用')

    class Meta:
        verbose_name = '排练室'
        verbose_name_plural = '排练室'

    def __str__(self):
        return self.name


class Equipment(models.Model):
    TYPE_CHOICES = [
        ('lighting', '灯光设备'),
        ('sound', '音响设备'),
        ('other', '其他设备'),
    ]

    name = models.CharField(max_length=100, verbose_name='设备名称')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='设备类型')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='equipments', verbose_name='所属排练室')
    is_working = models.BooleanField(default=True, verbose_name='正常工作')
    description = models.TextField(blank=True, verbose_name='描述')

    class Meta:
        verbose_name = '设备'
        verbose_name_plural = '设备'

    def __str__(self):
        return f'{self.name} ({self.get_type_display()})'


class Prop(models.Model):
    CATEGORY_CHOICES = [
        ('furniture', '家具'),
        ('weapon', '兵器'),
        ('clothing', '服装'),
        ('daily', '日常用品'),
        ('other', '其他'),
    ]

    name = models.CharField(max_length=100, verbose_name='道具名称')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name='道具分类')
    quantity = models.IntegerField(default=1, verbose_name='库存数量')
    description = models.TextField(blank=True, verbose_name='描述')
    image = models.ImageField(upload_to='props/', blank=True, null=True, verbose_name='图片')

    class Meta:
        verbose_name = '道具'
        verbose_name_plural = '道具'

    def __str__(self):
        return f'{self.name} ({self.quantity}件)'

    def available_quantity(self, date=None):
        if date is None:
            date = timezone.localdate()
        used = PropUsage.objects.filter(
            prop=self,
            rehearsal__date=date,
            rehearsal__status__in=['pending', 'approved', 'ongoing']
        ).aggregate(total=models.Sum('quantity'))['total'] or 0
        return self.quantity - used


class PropUsage(models.Model):
    prop = models.ForeignKey(Prop, on_delete=models.CASCADE, related_name='usages', verbose_name='道具')
    rehearsal = models.ForeignKey('Rehearsal', on_delete=models.CASCADE, related_name='prop_usages', verbose_name='排练')
    quantity = models.IntegerField(default=1, verbose_name='使用数量')
    returned = models.BooleanField(default=False, verbose_name='已归还')
    returned_at = models.DateTimeField(null=True, blank=True, verbose_name='归还时间')

    class Meta:
        verbose_name = '道具使用'
        verbose_name_plural = '道具使用'

    def __str__(self):
        return f'{self.prop.name} x {self.quantity}'


class Rehearsal(models.Model):
    STATUS_CHOICES = [
        ('pending', '待审批'),
        ('approved', '已通过'),
        ('rejected', '已拒绝'),
        ('ongoing', '进行中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    play = models.ForeignKey(Play, on_delete=models.CASCADE, related_name='rehearsals', verbose_name='剧目')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='rehearsals', verbose_name='排练室')
    director = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='directed_rehearsals', verbose_name='导演')
    members = models.ManyToManyField(Member, related_name='rehearsals', verbose_name='参与成员')
    date = models.DateField(verbose_name='排练日期')
    start_time = models.TimeField(verbose_name='开始时间')
    end_time = models.TimeField(verbose_name='结束时间')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    need_lighting = models.BooleanField(default=False, verbose_name='需要灯光')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, related_name='created_rehearsals', verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '排练安排'
        verbose_name_plural = '排练安排'
        ordering = ['-date', '-start_time']

    def __str__(self):
        return f'{self.play.title} - {self.date} {self.start_time}'

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError('结束时间必须晚于开始时间')
        if self.date < timezone.localdate():
            raise ValidationError('排练日期不能早于今天')

    def is_in_performance_week(self):
        return self.play.is_performance_week()

    def can_be_cancelled_by(self, member):
        if member.is_admin:
            return True
        if self.is_in_performance_week():
            return False
        return member == self.director or member == self.created_by

    def get_conflicts(self):
        if self.pk:
            conflicts = Rehearsal.objects.filter(
                room=self.room,
                date=self.date,
                status__in=['pending', 'approved', 'ongoing']
            ).exclude(pk=self.pk)
        else:
            conflicts = Rehearsal.objects.filter(
                room=self.room,
                date=self.date,
                status__in=['pending', 'approved', 'ongoing']
            )
        result = []
        for conflict in conflicts:
            if (self.start_time < conflict.end_time and self.end_time > conflict.start_time):
                result.append(conflict)
        return result


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', '准时'),
        ('late', '迟到'),
        ('absent', '缺席'),
    ]

    rehearsal = models.ForeignKey(Rehearsal, on_delete=models.CASCADE, related_name='attendances', verbose_name='排练')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendances', verbose_name='成员')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present', verbose_name='出勤状态')
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name='签到时间')
    late_minutes = models.IntegerField(default=0, verbose_name='迟到分钟数')
    notes = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '出勤记录'
        verbose_name_plural = '出勤记录'
        unique_together = ['rehearsal', 'member']

    def __str__(self):
        return f'{self.member.name} - {self.rehearsal} - {self.get_status_display()}'


class Message(models.Model):
    TYPE_CHOICES = [
        ('info', '通知'),
        ('warning', '警告'),
        ('change', '变动通知'),
        ('cancel', '取消通知'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info', verbose_name='消息类型')
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    rehearsal = models.ForeignKey(Rehearsal, on_delete=models.CASCADE, null=True, blank=True, related_name='messages', verbose_name='相关排练')
    sender = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, related_name='sent_messages', verbose_name='发送人')
    recipients = models.ManyToManyField(Member, related_name='received_messages', verbose_name='接收人')
    read_by = models.ManyToManyField(Member, related_name='read_messages', blank=True, verbose_name='已读人员')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '消息'
        verbose_name_plural = '消息'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class RoomMaintenance(models.Model):
    STATUS_CHOICES = [
        ('scheduled', '计划中'),
        ('ongoing', '进行中'),
        ('completed', '已完成'),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='maintenances', verbose_name='排练室')
    title = models.CharField(max_length=200, verbose_name='维修标题')
    description = models.TextField(verbose_name='维修描述')
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', verbose_name='状态')
    props_released = models.BooleanField(default=False, verbose_name='道具已释放')
    created_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '排练室维修'
        verbose_name_plural = '排练室维修'

    def __str__(self):
        return f'{self.room.name} - {self.title}'

    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError('结束日期不能早于开始日期')


class CancelRecord(models.Model):
    rehearsal = models.ForeignKey(Rehearsal, on_delete=models.CASCADE, related_name='cancel_records', verbose_name='排练')
    cancelled_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, verbose_name='取消人')
    reason = models.TextField(verbose_name='取消理由')
    cancelled_at = models.DateTimeField(auto_now_add=True, verbose_name='取消时间')

    class Meta:
        verbose_name = '取消记录'
        verbose_name_plural = '取消记录'

    def __str__(self):
        return f'{self.rehearsal} - 取消记录'
