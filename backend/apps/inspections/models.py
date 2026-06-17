from django.db import models
from django.conf import settings
from apps.projects.models import Project


class Inspection(models.Model):
    """巡检/验收记录"""
    TYPE_CHOICES = [
        ('daily', '日常巡检'),
        ('stage', '分阶段验收'),
        ('final', '竣工验收'),
        ('safety', '安全检查'),
        ('quality', '质量检查'),
    ]

    RESULT_CHOICES = [
        ('pass', '合格'),
        ('fail', '不合格'),
        ('pending', '待整改'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='inspections', verbose_name='项目')
    type = models.CharField('检查类型', max_length=20, choices=TYPE_CHOICES, default='daily')
    title = models.CharField('检查标题', max_length=200)
    inspection_date = models.DateTimeField('检查时间')
    location = models.CharField('检查位置', max_length=300, blank=True)
    result = models.CharField('检查结果', max_length=20, choices=RESULT_CHOICES, default='pending')
    description = models.TextField('检查描述', blank=True)

    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='conducted_inspections', verbose_name='检查人', null=True, blank=True
    )
    rectification_required = models.BooleanField('需要整改', default=False)
    rectification_deadline = models.DateTimeField('整改期限', null=True, blank=True)
    rectified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='rectified_inspections', verbose_name='整改人', null=True, blank=True
    )
    rectified_at = models.DateTimeField('整改完成时间', null=True, blank=True)
    rectification_note = models.TextField('整改说明', blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='created_inspections', verbose_name='创建人', null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '巡检记录'
        verbose_name_plural = verbose_name
        ordering = ['-inspection_date']

    def __str__(self):
        return f'{self.project.code} - {self.title} ({self.get_result_display()})'


class InspectionItem(models.Model):
    """巡检项"""
    RESULT_CHOICES = [
        ('pass', '合格'),
        ('fail', '不合格'),
        ('na', '不适用'),
    ]

    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='items', verbose_name='巡检记录')
    name = models.CharField('检查项名称', max_length=200)
    standard = models.CharField('检查标准', max_length=500, blank=True)
    result = models.CharField('结果', max_length=20, choices=RESULT_CHOICES, default='pass')
    description = models.TextField('问题描述', blank=True)
    sort_order = models.IntegerField('排序', default=0)

    class Meta:
        verbose_name = '巡检项'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.name} - {self.get_result_display()}'


class InspectionPhoto(models.Model):
    """巡检照片"""
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='photos', verbose_name='巡检记录')
    image = models.ImageField('照片', upload_to='inspection_photos/')
    title = models.CharField('标题', max_length=200, blank=True)
    description = models.TextField('描述', blank=True)
    is_issue = models.BooleanField('问题照片', default=False)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        verbose_name='上传人', null=True, blank=True
    )
    created_at = models.DateTimeField('上传时间', auto_now_add=True)

    class Meta:
        verbose_name = '巡检照片'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.title or str(self.id)
