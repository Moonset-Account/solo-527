from django.db import models
from django.conf import settings
from django.utils import timezone


class Project(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', '草稿'
        SUBMITTED = 'submitted', '已提交'
        PRE_REVIEW = 'pre_review', '秘书预审中'
        IN_REVIEW = 'in_review', '委员评审中'
        NEED_REVISION = 'need_revision', '需补件'
        ARCHIVED = 'archived', '已归档'
        REJECTED = 'rejected', '已驳回'

    title = models.CharField(max_length=200, verbose_name='课题名称')
    project_code = models.CharField(max_length=50, unique=True, verbose_name='课题编号')
    principal_investigator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='led_projects',
        verbose_name='负责人'
    )
    researchers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='projects',
        blank=True,
        verbose_name='参与研究者'
    )
    department = models.CharField(max_length=100, verbose_name='所属部门')
    description = models.TextField(verbose_name='课题简介')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='状态'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='提交时间')
    archived_at = models.DateTimeField(null=True, blank=True, verbose_name='归档时间')

    class Meta:
        verbose_name = '课题'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project_code} - {self.title}'

    def is_archived(self):
        return self.status == self.Status.ARCHIVED

    def can_edit(self, user):
        if self.is_archived():
            return False
        if user.is_secretary() or user.is_admin():
            return True
        if user == self.principal_investigator:
            return True
        if user in self.researchers.all() and self.status in [self.Status.DRAFT, self.Status.NEED_REVISION]:
            return True
        return False


class MaterialType(models.Model):
    name = models.CharField(max_length=100, verbose_name='材料名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='材料代码')
    description = models.TextField(blank=True, verbose_name='说明')
    is_required = models.BooleanField(default=True, verbose_name='是否必填')
    sort_order = models.IntegerField(default=0, verbose_name='排序')

    class Meta:
        verbose_name = '材料类型'
        verbose_name_plural = verbose_name
        ordering = ['sort_order']

    def __str__(self):
        return self.name


class ReviewClause(models.Model):
    clause_number = models.CharField(max_length=20, unique=True, verbose_name='条款编号')
    title = models.CharField(max_length=200, verbose_name='条款标题')
    content = models.TextField(verbose_name='条款内容')
    category = models.CharField(max_length=100, verbose_name='分类')
    sort_order = models.IntegerField(default=0, verbose_name='排序')

    class Meta:
        verbose_name = '评审条款'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'clause_number']

    def __str__(self):
        return f'{self.clause_number} {self.title}'


class Material(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='materials',
        verbose_name='课题'
    )
    material_type = models.ForeignKey(
        MaterialType,
        on_delete=models.PROTECT,
        verbose_name='材料类型'
    )
    current_version = models.OneToOneField(
        'MaterialVersion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_for',
        verbose_name='当前版本'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '材料'
        verbose_name_plural = verbose_name
        unique_together = ('project', 'material_type')
        ordering = ['material_type__sort_order']

    def __str__(self):
        return f'{self.project.project_code} - {self.material_type.name}'

    def get_latest_version(self):
        return self.versions.order_by('-version_number').first()


class MaterialVersion(models.Model):
    material = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name='材料'
    )
    version_number = models.IntegerField(verbose_name='版本号')
    title = models.CharField(max_length=200, verbose_name='版本标题')
    file = models.FileField(upload_to='materials/%Y/%m/', verbose_name='文件')
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        verbose_name='上传者'
    )
    description = models.TextField(blank=True, verbose_name='版本说明')
    is_archived = models.BooleanField(default=False, verbose_name='是否已归档')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '材料版本'
        verbose_name_plural = verbose_name
        unique_together = ('material', 'version_number')
        ordering = ['-version_number']

    def __str__(self):
        return f'{self.material} - v{self.version_number}'

    def save(self, *args, **kwargs):
        if self.version_number is None:
            max_version = self.material.versions.aggregate(
                max=models.Max('version_number')
            )['max'] or 0
            self.version_number = max_version + 1
        super().save(*args, **kwargs)


class ReviewAssignment(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='review_assignments',
        verbose_name='课题'
    )
    committee_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='assigned_reviews',
        verbose_name='伦理委员'
    )
    material_types = models.ManyToManyField(
        MaterialType,
        verbose_name='负责材料类型'
    )
    assigned_at = models.DateTimeField(auto_now_add=True, verbose_name='分配时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')

    class Meta:
        verbose_name = '评审分配'
        verbose_name_plural = verbose_name
        unique_together = ('project', 'committee_member')

    def __str__(self):
        return f'{self.project.project_code} - {self.committee_member.get_full_name()}'


class ReviewComment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', '待处理'
        ADDRESSED = 'addressed', '已回应'
        ACCEPTED = 'accepted', '已接受'

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='review_comments',
        verbose_name='课题'
    )
    material_version = models.ForeignKey(
        MaterialVersion,
        on_delete=models.CASCADE,
        related_name='review_comments',
        verbose_name='材料版本'
    )
    clause = models.ForeignKey(
        ReviewClause,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name='对应条款'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='review_comments',
        verbose_name='评审人'
    )
    content = models.TextField(verbose_name='评审意见')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='状态'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '评审意见'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project.project_code} - {self.reviewer.get_full_name()}'


class Resubmission(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='resubmissions',
        verbose_name='课题'
    )
    material_version = models.ForeignKey(
        MaterialVersion,
        on_delete=models.CASCADE,
        related_name='resubmissions',
        verbose_name='补件版本'
    )
    submitter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='resubmissions',
        verbose_name='提交者'
    )
    addressed_comments = models.ManyToManyField(
        ReviewComment,
        related_name='resubmissions',
        verbose_name='回应的意见'
    )
    response_note = models.TextField(verbose_name='回应说明')
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name='补件时间')

    class Meta:
        verbose_name = '补件记录'
        verbose_name_plural = verbose_name
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.project.project_code} - 补件 #{self.id}'


class ExportLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='exports',
        verbose_name='导出人'
    )
    export_type = models.CharField(max_length=100, verbose_name='导出类型')
    filter_params = models.JSONField(default=dict, verbose_name='筛选条件')
    file_name = models.CharField(max_length=200, verbose_name='文件名')
    exported_at = models.DateTimeField(auto_now_add=True, verbose_name='导出时间')

    class Meta:
        verbose_name = '导出日志'
        verbose_name_plural = verbose_name
        ordering = ['-exported_at']

    def __str__(self):
        return f'{self.export_type} - {self.user.get_full_name()}'
