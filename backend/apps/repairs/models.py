from django.db import models
from django.conf import settings
from apps.projects.models import Project


class Repair(models.Model):
    """售后报修单"""
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('assigned', '已派单'),
        ('in_progress', '处理中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '紧急'),
    ]

    CATEGORY_CHOICES = [
        ('water', '水电'),
        ('decoration', '装修'),
        ('structure', '结构'),
        ('appliance', '设备'),
        ('other', '其他'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='repairs', verbose_name='项目')
    code = models.CharField('报修单号', max_length=50, unique=True)
    title = models.CharField('报修标题', max_length=200)
    category = models.CharField('报修类型', max_length=20, choices=CATEGORY_CHOICES, default='other')
    priority = models.CharField('优先级', max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')

    reporter_name = models.CharField('报修人姓名', max_length=100)
    reporter_phone = models.CharField('报修人电话', max_length=20)
    location = models.CharField('报修位置', max_length=300)
    description = models.TextField('问题描述')

    material_cost = models.DecimalField('材料费用', max_digits=12, decimal_places=2, default=0)
    labor_cost = models.DecimalField('人工费用', max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField('总费用', max_digits=12, decimal_places=2, default=0)

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='assigned_repairs', verbose_name='处理人', null=True, blank=True
    )
    assigned_at = models.DateTimeField('派单时间', null=True, blank=True)
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)
    resolution = models.TextField('处理方案', blank=True)
    client_feedback = models.TextField('客户反馈', blank=True)
    satisfaction = models.IntegerField('满意度(1-5)', null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='created_repairs', verbose_name='创建人', null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '售后报修'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} - {self.title}'

    def calculate_total(self):
        self.total_cost = self.material_cost + self.labor_cost
        return self.total_cost


class RepairPhoto(models.Model):
    """报修照片"""
    repair = models.ForeignKey(Repair, on_delete=models.CASCADE, related_name='photos', verbose_name='报修单')
    image = models.ImageField('照片', upload_to='repair_photos/')
    title = models.CharField('标题', max_length=200, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        verbose_name='上传人', null=True, blank=True
    )
    created_at = models.DateTimeField('上传时间', auto_now_add=True)

    class Meta:
        verbose_name = '报修照片'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.title or str(self.id)


class RepairNote(models.Model):
    """报修处理记录"""
    repair = models.ForeignKey(Repair, on_delete=models.CASCADE, related_name='notes', verbose_name='报修单')
    content = models.TextField('处理记录')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        verbose_name='记录人', null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '报修处理记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.repair.code} - {self.content[:30]}'
