from django.db import models
from django.conf import settings
from django.utils import timezone
from children.models import Child
from children.models import AuthorizedPickupPerson


class PickupRecord(models.Model):
    DIRECTION_CHOICES = [
        ('dropoff', '送园'),
        ('pickup', '接走'),
    ]
    STATUS_CHOICES = [
        ('pending', '待核验'),
        ('verified', '已核验'),
        ('rejected', '已拒绝'),
    ]
    child = models.ForeignKey(
        Child, on_delete=models.CASCADE,
        related_name='pickup_records', verbose_name='儿童',
    )
    direction = models.CharField('方向', max_length=10, choices=DIRECTION_CHOICES)
    authorized_person = models.ForeignKey(
        AuthorizedPickupPerson, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='pickup_records', verbose_name='授权接送人',
    )
    actual_person_name = models.CharField('实际接送人姓名', max_length=50, blank=True, default='')
    actual_person_id = models.CharField('实际接送人身份证', max_length=18, blank=True, default='')
    status = models.CharField('状态', max_length=10, choices=STATUS_CHOICES, default='pending')
    pickup_time = models.DateTimeField('接送时间', default=timezone.now)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='verified_pickups', verbose_name='核验人',
    )
    remark = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'pickup_pickuprecord'
        verbose_name = '接送记录'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['child', 'pickup_time'], name='idx_pickup_child_time'),
            models.Index(fields=['status'], name='idx_pickup_status'),
            models.Index(fields=['pickup_time'], name='idx_pickup_time'),
        ]

    def __str__(self):
        return f'{self.child.name} - {self.get_direction_display()} - {self.pickup_time.strftime("%Y-%m-%d %H:%M")}'
