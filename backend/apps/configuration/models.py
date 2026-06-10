import uuid

from django.db import models

from apps.properties.models import Property, Room
from apps.users.models import User


class TourRoute(models.Model):
    id = models.BigAutoField(primary_key=True)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='tour_routes',
        verbose_name='民宿',
        null=True,
        blank=True
    )
    name = models.CharField('路线名称', max_length=100)
    description = models.TextField('描述', blank=True)
    duration_minutes = models.IntegerField('预计时长(分钟)', default=60)
    version = models.CharField('版本号', max_length=20, default='1.0')
    is_published = models.BooleanField('是否已发布', default=False)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_routes',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'tour_route'
        verbose_name = '导览路线'
        verbose_name_plural = '导览路线'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} v{self.version}'


class TourWaypoint(models.Model):
    id = models.BigAutoField(primary_key=True)
    route = models.ForeignKey(TourRoute, on_delete=models.CASCADE, related_name='waypoints', verbose_name='路线')
    name = models.CharField('点位名称', max_length=100)
    description = models.TextField('介绍', blank=True)
    latitude = models.DecimalField('纬度', max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField('经度', max_digits=9, decimal_places=6, null=True, blank=True)
    duration_minutes = models.IntegerField('停留时长(分钟)', default=10)
    sort_order = models.IntegerField('排序', default=0)
    image = models.ImageField('图片', upload_to='routes/waypoints/', null=True, blank=True)

    class Meta:
        db_table = 'tour_waypoint'
        verbose_name = '导览点位'
        verbose_name_plural = '导览点位'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.route.name} - {self.name}'


class CleaningTask(models.Model):
    STATUS_CHOICES = (
        ('pending', '待分配'),
        ('assigned', '已分配'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('任务名称', max_length=100)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='cleaning_tasks', verbose_name='房型')
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_cleaning_tasks',
        verbose_name='负责人'
    )
    estimated_minutes = models.IntegerField('预计时长(分钟)', default=60)
    priority = models.IntegerField('优先级', default=2, choices=((1, '高'), (2, '中'), (3, '低')))
    checklist = models.JSONField('清洁清单', default=list, blank=True)
    start_time = models.DateTimeField('开始时间', null=True, blank=True)
    end_time = models.DateTimeField('结束时间', null=True, blank=True)
    deadline = models.DateTimeField('截止时间', null=True, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField('备注', blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_cleaning_tasks',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'cleaning_task'
        verbose_name = '清洁任务'
        verbose_name_plural = '清洁任务'
        indexes = [
            models.Index(fields=['status', 'deadline'], name='idx_cleaning_status'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.room.name}'


class ItineraryVersion(models.Model):
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('published', '已发布'),
        ('archived', '已归档'),
    )

    id = models.BigAutoField(primary_key=True)
    version = models.CharField('版本号', max_length=20)
    name = models.CharField('名称', max_length=100)
    description = models.TextField('描述', blank=True)
    content = models.JSONField('行程内容', default=dict)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_itineraries',
        verbose_name='创建人'
    )
    published_at = models.DateTimeField('发布时间', null=True, blank=True)
    published_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='published_itineraries',
        verbose_name='发布人'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'itinerary_version'
        verbose_name = '行程版本'
        verbose_name_plural = '行程版本'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} v{self.version}'

    @property
    def is_latest(self):
        return not ItineraryVersion.objects.filter(
            status='published',
            created_at__gt=self.created_at
        ).exists()
