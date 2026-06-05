from django.db import models
from django.conf import settings
from children.models import Child


class DailyRecord(models.Model):
    MOOD_CHOICES = [
        ('happy', '开心'),
        ('calm', '平静'),
        ('fussy', '烦躁'),
        ('crying', '哭闹'),
    ]
    APPETITE_CHOICES = [
        ('good', '好'),
        ('normal', '一般'),
        ('poor', '差'),
    ]
    child = models.ForeignKey(
        Child, on_delete=models.CASCADE,
        related_name='daily_records', verbose_name='儿童',
    )
    date = models.DateField('日期')
    mood = models.CharField('情绪', max_length=10, choices=MOOD_CHOICES, blank=True, default='')
    appetite = models.CharField('食欲', max_length=10, choices=APPETITE_CHOICES, blank=True, default='')
    nap_start = models.TimeField('午睡开始', null=True, blank=True)
    nap_end = models.TimeField('午睡结束', null=True, blank=True)
    nap_quality = models.CharField('午睡质量', max_length=20, blank=True, default='')
    breakfast = models.TextField('早餐', blank=True, default='')
    lunch = models.TextField('午餐', blank=True, default='')
    snack = models.TextField('点心', blank=True, default='')
    activities = models.TextField('活动记录', blank=True, default='')
    notes = models.TextField('备注', blank=True, default='')
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='recorded_daily_records', verbose_name='记录人',
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'daily_records_dailyrecord'
        verbose_name = '每日记录'
        verbose_name_plural = verbose_name
        unique_together = [('child', 'date')]
        indexes = [
            models.Index(fields=['date'], name='idx_dailyrecord_date'),
            models.Index(fields=['child', 'date'], name='idx_dailyrecord_child_date'),
        ]

    def __str__(self):
        return f'{self.child.name} - {self.date}'


class GrowthPhoto(models.Model):
    record = models.ForeignKey(
        DailyRecord, on_delete=models.CASCADE,
        related_name='photos', verbose_name='每日记录',
    )
    image = models.ImageField('照片', upload_to='growth_photos/%Y/%m/')
    caption = models.CharField('说明', max_length=200, blank=True, default='')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, verbose_name='上传人',
    )
    created_at = models.DateTimeField('上传时间', auto_now_add=True)

    class Meta:
        db_table = 'daily_records_growthphoto'
        verbose_name = '成长照片'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.record.child.name} - {self.caption or "照片"}'
