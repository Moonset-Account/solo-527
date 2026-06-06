from django.db import models
from core.models import BaseModel


class PickupRecord(BaseModel):
    TYPE_CHOICES = (
        ('dropoff', '入园'),
        ('pickup', '离园'),
    )
    STATUS_CHOICES = (
        ('pending', '待核验'),
        ('verified', '已核验'),
        ('rejected', '已拒绝'),
        ('cancelled', '已取消'),
    )
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='pickup_records', verbose_name='儿童')
    pickup_type = models.CharField('接送类型', max_length=20, choices=TYPE_CHOICES)
    pickup_time = models.DateTimeField('接送时间', null=True, blank=True)
    pickup_person_name = models.CharField('接送人姓名', max_length=50)
    pickup_person_phone = models.CharField('接送人电话', max_length=20)
    pickup_person_relation = models.CharField('接送人关系', max_length=20)
    authorized_person = models.ForeignKey(
        'children.AuthorizedPickupPerson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pickup_records',
        verbose_name='匹配授权人'
    )
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_pickups',
        verbose_name='核验人'
    )
    verified_at = models.DateTimeField('核验时间', null=True, blank=True)
    reject_reason = models.TextField('拒绝原因', blank=True)
    notes = models.TextField('备注', blank=True)
    temperature = models.DecimalField('体温', max_digits=3, decimal_places=1, null=True, blank=True)
    photos = models.JSONField('现场照片', default=list, blank=True)

    class Meta:
        verbose_name = '接送记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.child.name} - {self.get_pickup_type_display()} - {self.get_status_display()}'


class PickupTask(BaseModel):
    STATUS_CHOICES = (
        ('pending', '待接'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('failed', '失败'),
    )
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='pickup_tasks', verbose_name='儿童')
    scheduled_time = models.DateTimeField('预计时间')
    pickup_type = models.CharField('类型', max_length=20, choices=PickupRecord.TYPE_CHOICES)
    assigned_teacher = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_pickup_tasks',
        verbose_name='负责老师'
    )
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    pickup_record = models.OneToOneField(
        PickupRecord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='task',
        verbose_name='关联记录'
    )
    remarks = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '接送任务'
        verbose_name_plural = verbose_name
        ordering = ['scheduled_time']

    def __str__(self):
        return f'{self.child.name} - {self.scheduled_time}'
