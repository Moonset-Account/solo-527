from django.db import models
from django.conf import settings


class Project(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('quoting', '报价中'),
        ('approved', '已确认'),
        ('in_progress', '施工中'),
        ('inspecting', '验收中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    name = models.CharField('项目名称', max_length=200)
    code = models.CharField('项目编号', max_length=50, unique=True)
    address = models.CharField('项目地址', max_length=500)
    description = models.TextField('项目描述', blank=True)
    client_name = models.CharField('客户姓名', max_length=100)
    client_phone = models.CharField('客户电话', max_length=20)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    area = models.DecimalField('面积(㎡)', max_digits=10, decimal_places=2, default=0)
    start_date = models.DateField('开始日期', null=True, blank=True)
    end_date = models.DateField('结束日期', null=True, blank=True)

    project_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='managed_projects', verbose_name='项目经理',
        null=True, blank=True
    )
    material_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='material_projects', verbose_name='材料员',
        null=True, blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='created_projects', verbose_name='创建人',
        null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '项目'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} - {self.name}'


class ProjectPhoto(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='photos', verbose_name='项目')
    image = models.ImageField('现场照片', upload_to='project_photos/')
    title = models.CharField('标题', max_length=200, blank=True)
    description = models.TextField('描述', blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        verbose_name='上传人', null=True, blank=True
    )
    created_at = models.DateTimeField('上传时间', auto_now_add=True)

    class Meta:
        verbose_name = '项目照片'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project.name} - {self.title or self.id}'


class ProjectAttachment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='attachments', verbose_name='项目')
    file = models.FileField('附件', upload_to='project_attachments/')
    name = models.CharField('文件名', max_length=200)
    description = models.TextField('描述', blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        verbose_name='上传人', null=True, blank=True
    )
    created_at = models.DateTimeField('上传时间', auto_now_add=True)

    class Meta:
        verbose_name = '项目附件'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ProjectNote(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notes', verbose_name='项目')
    content = models.TextField('备注内容')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        verbose_name='创建人', null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '项目备注'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project.name} - {self.content[:30]}'


class ChangeHistory(models.Model):
    """通用修改历史记录"""
    content_type = models.CharField('关联类型', max_length=50)
    object_id = models.PositiveIntegerField('关联ID')
    field_name = models.CharField('字段名', max_length=100)
    old_value = models.TextField('旧值', blank=True, null=True)
    new_value = models.TextField('新值', blank=True, null=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        verbose_name='修改人', null=True, blank=True
    )
    changed_at = models.DateTimeField('修改时间', auto_now_add=True)
    remark = models.CharField('备注', max_length=500, blank=True)

    class Meta:
        verbose_name = '修改历史'
        verbose_name_plural = verbose_name
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f'{self.content_type}#{self.object_id}: {self.field_name}'
