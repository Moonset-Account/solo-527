import uuid
from django.db import models
from django.conf import settings


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Contract(TimeStampedModel):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('submitted', '已提交'),
        ('under_review', '审查中'),
        ('approved', '已通过'),
        ('rejected', '已退回'),
        ('stamped', '已盖章'),
        ('archived', '已归档'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField('合同标题', max_length=255)
    contract_number = models.CharField('合同编号', max_length=100, unique=True)
    file = models.FileField('合同文件', upload_to='uploads/contracts/%Y/%m/')
    counterparty = models.CharField('对方单位', max_length=255, blank=True)
    contract_type = models.CharField('合同类型', max_length=100, blank=True)
    amount = models.DecimalField('合同金额', max_digits=15, decimal_places=2, null=True, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='uploaded_contracts', verbose_name='上传人')
    description = models.TextField('说明', blank=True)

    class Meta:
        verbose_name = '合同'
        verbose_name_plural = '合同'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.contract_number} - {self.title}'


class ReviewWorkflow(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('流程名称', max_length=255)
    description = models.TextField('流程说明', blank=True)
    contract_type = models.CharField('适用合同类型', max_length=100, blank=True)
    is_active = models.BooleanField('是否启用', default=True)

    class Meta:
        verbose_name = '审查流程'
        verbose_name_plural = '审查流程'

    def __str__(self):
        return self.name


class ReviewStep(TimeStampedModel):
    RESULT_CHOICES = [
        ('pending', '待审'),
        ('pass', '通过'),
        ('reject', '退回'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(ReviewWorkflow, on_delete=models.CASCADE, related_name='steps', verbose_name='所属流程')
    order = models.PositiveIntegerField('步骤顺序')
    name = models.CharField('步骤名称', max_length=255)
    reviewer_role = models.CharField('审查人角色', max_length=100)
    is_required = models.BooleanField('是否必须', default=True)

    class Meta:
        verbose_name = '审查步骤'
        verbose_name_plural = '审查步骤'
        ordering = ['workflow', 'order']
        unique_together = ['workflow', 'order']

    def __str__(self):
        return f'{self.workflow.name} - 第{self.order}步: {self.name}'


class ContractReview(TimeStampedModel):
    STATUS_CHOICES = [
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('rejected', '已退回'),
        ('cancelled', '已取消'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='reviews', verbose_name='合同')
    workflow = models.ForeignKey(ReviewWorkflow, on_delete=models.PROTECT, related_name='reviews', verbose_name='审查流程')
    current_step = models.ForeignKey(ReviewStep, on_delete=models.SET_NULL, null=True, blank=True, related_name='active_reviews', verbose_name='当前步骤')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='in_progress')
    started_at = models.DateTimeField('开始时间', auto_now_add=True)
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)

    class Meta:
        verbose_name = '合同审查'
        verbose_name_plural = '合同审查'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.contract.contract_number} 审查流程'


class ReviewOpinion(TimeStampedModel):
    RESULT_CHOICES = [
        ('pass', '通过'),
        ('reject', '退回'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract_review = models.ForeignKey(ContractReview, on_delete=models.CASCADE, related_name='opinions', verbose_name='合同审查')
    step = models.ForeignKey(ReviewStep, on_delete=models.PROTECT, verbose_name='审查步骤')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='review_opinions', verbose_name='审查人')
    opinion = models.TextField('审查意见')
    result = models.CharField('审查结果', max_length=10, choices=RESULT_CHOICES)
    reviewed_at = models.DateTimeField('审查时间', auto_now_add=True)

    class Meta:
        verbose_name = '审查意见'
        verbose_name_plural = '审查意见'
        ordering = ['-reviewed_at']

    def __str__(self):
        return f'{self.reviewer} - {self.get_result_display()}'


class StampNode(TimeStampedModel):
    STATUS_CHOICES = [
        ('pending', '待盖章'),
        ('completed', '已盖章'),
        ('cancelled', '已取消'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business_form = models.ForeignKey(ContractReview, on_delete=models.CASCADE, related_name='stamp_nodes', verbose_name='业务单')
    stamp_type = models.CharField('盖章类型', max_length=100)
    handler = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='handled_stamps', verbose_name='处理人')
    handled_at = models.DateTimeField('处理时间', null=True, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    remark = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '盖章节点'
        verbose_name_plural = '盖章节点'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.business_form} - {self.stamp_type}'


class EvidenceChecklist(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business_form = models.ForeignKey(ContractReview, on_delete=models.CASCADE, related_name='evidence_checklists', verbose_name='业务单')
    item_name = models.CharField('证据项名称', max_length=255)
    is_required = models.BooleanField('是否必须', default=True)
    is_collected = models.BooleanField('是否已收集', default=False)
    collector = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='collected_evidences', verbose_name='收集人')
    collected_at = models.DateTimeField('收集时间', null=True, blank=True)

    class Meta:
        verbose_name = '证据清单'
        verbose_name_plural = '证据清单'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.business_form} - {self.item_name}'


class EvidenceMaterial(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    checklist = models.ForeignKey(EvidenceChecklist, on_delete=models.CASCADE, related_name='materials', verbose_name='证据清单项')
    business_form = models.ForeignKey(ContractReview, on_delete=models.CASCADE, related_name='evidence_materials', verbose_name='业务单')
    file = models.FileField('证据文件', upload_to='uploads/evidences/%Y/%m/')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_evidences', verbose_name='上传人')
    description = models.TextField('描述', blank=True)

    class Meta:
        verbose_name = '证据材料'
        verbose_name_plural = '证据材料'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.checklist.item_name} - 证据材料'


class ProgressRecord(TimeStampedModel):
    STAGE_CHOICES = [
        ('upload', '上传'),
        ('submit', '提交'),
        ('review', '审查'),
        ('approve', '审批'),
        ('stamp', '盖章'),
        ('archive', '归档'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business_form = models.ForeignKey(ContractReview, on_delete=models.CASCADE, related_name='progress_records', verbose_name='业务单')
    stage = models.CharField('阶段', max_length=20, choices=STAGE_CHOICES)
    handler = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='处理人')
    action = models.CharField('操作', max_length=255)
    remark = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '办理进度'
        verbose_name_plural = '办理进度'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.business_form} - {self.get_stage_display()} - {self.action}'


class RejectionNotification(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract_review = models.ForeignKey(ContractReview, on_delete=models.CASCADE, related_name='rejection_notifications', verbose_name='合同审查')
    rejected_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='sent_rejections', verbose_name='退回人')
    compliance_manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='received_rejections', verbose_name='合规经理')
    reason = models.TextField('退回原因')
    is_read = models.BooleanField('是否已读', default=False)
    synced_to_board = models.BooleanField('是否已同步至看板', default=False)

    class Meta:
        verbose_name = '退回提醒'
        verbose_name_plural = '退回提醒'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.contract_review} - 退回提醒 -> {self.compliance_manager}'
