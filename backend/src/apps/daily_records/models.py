from django.db import models
from core.models import BaseModel


class DailyRecord(BaseModel):
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='daily_records', verbose_name='儿童')
    record_date = models.DateField('记录日期')
    teacher = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='daily_records', verbose_name='记录老师')
    mood = models.CharField('情绪', max_length=50, blank=True)
    health_status = models.CharField('健康状况', max_length=100, blank=True)
    notes = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '每日记录'
        verbose_name_plural = verbose_name
        ordering = ['-record_date', '-created_at']
        unique_together = ('child', 'record_date')

    def __str__(self):
        return f'{self.child.name} - {self.record_date}'


class NapRecord(BaseModel):
    daily_record = models.ForeignKey(DailyRecord, on_delete=models.CASCADE, related_name='nap_records', verbose_name='每日记录')
    start_time = models.DateTimeField('开始时间')
    end_time = models.DateTimeField('结束时间', null=True, blank=True)
    quality = models.CharField('睡眠质量', max_length=20, choices=(
        ('good', '好'),
        ('normal', '一般'),
        ('poor', '差'),
    ), blank=True)
    notes = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '午睡记录'
        verbose_name_plural = verbose_name
        ordering = ['-start_time']

    def __str__(self):
        return f'{self.daily_record.child.name} 午睡 - {self.start_time}'


class MealRecord(BaseModel):
    MEAL_TYPE_CHOICES = (
        ('breakfast', '早餐'),
        ('lunch', '午餐'),
        ('dinner', '晚餐'),
        ('snack', '加餐'),
    )
    daily_record = models.ForeignKey(DailyRecord, on_delete=models.CASCADE, related_name='meal_records', verbose_name='每日记录')
    meal_type = models.CharField('餐次', max_length=20, choices=MEAL_TYPE_CHOICES)
    menu = models.TextField('食谱')
    appetite = models.CharField('食欲', max_length=20, choices=(
        ('good', '好'),
        ('normal', '一般'),
        ('poor', '差'),
    ), blank=True)
    portion = models.DecimalField('进食量', max_digits=3, decimal_places=1, null=True, blank=True, help_text='百分比，如0.8表示80%')
    notes = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '用餐记录'
        verbose_name_plural = verbose_name
        ordering = ['daily_record', 'meal_type']

    def __str__(self):
        return f'{self.daily_record.child.name} {self.get_meal_type_display()}'


class ActivityRecord(BaseModel):
    daily_record = models.ForeignKey(DailyRecord, on_delete=models.CASCADE, related_name='activity_records', verbose_name='每日记录')
    activity_type = models.CharField('活动类型', max_length=50)
    description = models.TextField('活动描述')
    duration = models.IntegerField('持续时间(分钟)', null=True, blank=True)
    photos = models.JSONField('活动照片', default=list, blank=True)
    notes = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '活动记录'
        verbose_name_plural = verbose_name
        ordering = ['-daily_record__record_date']

    def __str__(self):
        return f'{self.daily_record.child.name} {self.activity_type}'


class GrowthRecord(BaseModel):
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='growth_records', verbose_name='儿童')
    record_date = models.DateField('记录日期')
    height = models.DecimalField('身高(cm)', max_digits=5, decimal_places=1, null=True, blank=True)
    weight = models.DecimalField('体重(kg)', max_digits=5, decimal_places=2, null=True, blank=True)
    head_circumference = models.DecimalField('头围(cm)', max_digits=4, decimal_places=1, null=True, blank=True)
    bmi = models.DecimalField('BMI', max_digits=4, decimal_places=1, null=True, blank=True)
    teacher = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='growth_records', verbose_name='记录人')
    notes = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '成长记录'
        verbose_name_plural = verbose_name
        ordering = ['-record_date']

    def save(self, *args, **kwargs):
        if self.height and self.weight:
            height_m = self.height / 100
            self.bmi = round(self.weight / (height_m * height_m), 1)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.child.name} 成长记录 - {self.record_date}'
