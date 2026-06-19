from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel
from common.managers import ProductionDataManager, TestDataManager


class Volunteer(BaseModel):
    STATUS_CHOICES = (
        ('active', '活跃'),
        ('inactive', '不活跃'),
        ('suspended', '暂停'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='volunteer_profile',
        verbose_name='关联用户'
    )
    volunteer_id = models.CharField(max_length=50, unique=True, verbose_name='志愿者编号')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='状态')
    skills = models.TextField(blank=True, verbose_name='技能特长')
    available_time = models.CharField(max_length=200, blank=True, verbose_name='可服务时间')
    service_areas = models.TextField(blank=True, verbose_name='服务区域')
    total_service_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0, verbose_name='累计服务时长')
    service_count = models.IntegerField(default=0, verbose_name='服务次数')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5, verbose_name='评分')
    join_date = models.DateField(null=True, blank=True, verbose_name='加入日期')
    emergency_contact = models.CharField(max_length=100, blank=True, verbose_name='紧急联系人')
    emergency_phone = models.CharField(max_length=20, blank=True, verbose_name='紧急联系电话')
    remark = models.TextField(blank=True, verbose_name='备注')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '志愿者'
        verbose_name_plural = verbose_name
        ordering = ['-total_service_hours', '-service_count']

    def __str__(self):
        return f'{self.volunteer_id} - {self.user.get_full_name()}'

    def update_service_stats(self, hours):
        self.total_service_hours += hours
        self.service_count += 1
        self.save()


class VolunteerRoute(BaseModel):
    name = models.CharField(max_length=100, verbose_name='路线名称')
    description = models.TextField(blank=True, verbose_name='路线描述')
    community = models.CharField(max_length=100, blank=True, verbose_name='所属社区')
    start_point = models.CharField(max_length=200, verbose_name='起点')
    end_point = models.CharField(max_length=200, verbose_name='终点')
    waypoints = models.TextField(blank=True, verbose_name='途经点（JSON格式）')
    estimated_duration = models.IntegerField(default=60, verbose_name='预计时长（分钟）')
    distance = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='距离（公里）')
    waypoints_count = models.IntegerField(default=0, verbose_name='途经点数量')
    estimated_people_count = models.IntegerField(default=0, verbose_name='预计覆盖人数')
    required_volunteers = models.IntegerField(default=2, verbose_name='需要志愿者人数')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '志愿者路线'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name


class VolunteerAssignment(BaseModel):
    volunteer = models.ForeignKey(
        Volunteer,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name='志愿者'
    )
    route = models.ForeignKey(
        VolunteerRoute,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name='路线'
    )
    scheduled_date = models.DateField(verbose_name='计划日期')
    scheduled_start_time = models.TimeField(verbose_name='计划开始时间')
    scheduled_end_time = models.TimeField(verbose_name='计划结束时间')
    actual_start_time = models.DateTimeField(null=True, blank=True, verbose_name='实际开始时间')
    actual_end_time = models.DateTimeField(null=True, blank=True, verbose_name='实际结束时间')
    actual_duration = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='实际时长（小时）')
    status = models.CharField(
        max_length=20,
        choices=(
            ('scheduled', '已排班'),
            ('in_progress', '进行中'),
            ('completed', '已完成'),
            ('cancelled', '已取消'),
        ),
        default='scheduled',
        verbose_name='状态'
    )
    check_ins = models.TextField(blank=True, verbose_name='签到记录（JSON格式）')
    issues_found = models.TextField(blank=True, verbose_name='发现的问题')
    feedback = models.TextField(blank=True, verbose_name='反馈')
    rating = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)], verbose_name='评分')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '志愿者排班'
        verbose_name_plural = verbose_name
        ordering = ['-scheduled_date', '-scheduled_start_time']

    def __str__(self):
        return f'{self.volunteer.user.get_full_name()} - {self.route.name} - {self.scheduled_date}'

    def complete(self, duration, issues='', feedback='', rating=None):
        self.status = 'completed'
        self.actual_end_time = timezone.now()
        self.actual_duration = duration
        self.issues_found = issues
        self.feedback = feedback
        self.rating = rating
        self.save()

        self.volunteer.update_service_stats(duration)

        if rating:
            total_rating = self.volunteer.rating * self.volunteer.service_count
            new_count = self.volunteer.service_count
            self.volunteer.rating = (total_rating + rating) / new_count if new_count > 0 else rating
            self.volunteer.save()
