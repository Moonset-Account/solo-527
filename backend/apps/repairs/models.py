from django.db import models
from django.utils import timezone
from apps.common.models import BaseModel
from apps.accounts.models import User
from apps.books.models import BookCopy, BookStatus


class RepairStatus(models.TextChoices):
    REPORTED = 'reported', '已上报'
    ASSESSING = 'assessing', '评估中'
    IN_PROGRESS = 'in_progress', '修复中'
    COMPLETED = 'completed', '已完成'
    CANCELLED = 'cancelled', '已取消'
    SCRAPPED = 'scrapped', '已报废'


class DamageType(models.TextChoices):
    TEAR = 'tear', '撕裂'
    STAIN = 'stain', '污渍'
    PAGE_MISSING = 'page_missing', '缺页'
    BINDING = 'binding', '装订问题'
    WATER_DAMAGE = 'water_damage', '水渍'
    MOLD = 'mold', '霉变'
    OTHER = 'other', '其他'


class RepairRecord(BaseModel):
    book_copy = models.ForeignKey(BookCopy, on_delete=models.CASCADE, related_name='repair_records', verbose_name='绘本副本')
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reported_repairs', verbose_name='上报人')
    damage_type = models.CharField(max_length=30, choices=DamageType.choices, verbose_name='破损类型')
    description = models.TextField(verbose_name='破损描述')
    status = models.CharField(max_length=20, choices=RepairStatus.choices, default=RepairStatus.REPORTED, verbose_name='修复状态')
    priority = models.CharField(max_length=10, choices=[
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '紧急'),
    ], default='medium', verbose_name='优先级')
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='预估费用')
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='实际费用')
    reported_at = models.DateTimeField(auto_now_add=True, verbose_name='上报时间')
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='开始修复时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_repairs', verbose_name='修复负责人')
    notes = models.TextField(blank=True, verbose_name='修复备注')

    class Meta:
        db_table = 'repairs_repair_record'
        verbose_name = '修复记录'
        verbose_name_plural = verbose_name
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f'{self.book_copy.book.title} - {self.get_damage_type_display()}'

    def can_transition(self, new_status):
        valid_transitions = {
            RepairStatus.REPORTED: [RepairStatus.ASSESSING, RepairStatus.CANCELLED],
            RepairStatus.ASSESSING: [RepairStatus.IN_PROGRESS, RepairStatus.SCRAPPED, RepairStatus.CANCELLED],
            RepairStatus.IN_PROGRESS: [RepairStatus.COMPLETED, RepairStatus.SCRAPPED],
            RepairStatus.COMPLETED: [],
            RepairStatus.CANCELLED: [],
            RepairStatus.SCRAPPED: [],
        }
        return new_status in valid_transitions.get(self.status, [])

    def transition(self, new_status, **kwargs):
        if not self.can_transition(new_status):
            raise ValueError(f'不能从 {self.get_status_display()} 转换到 {new_status}')
        
        self.status = new_status
        now = timezone.now()
        
        if new_status == RepairStatus.IN_PROGRESS:
            self.started_at = now
            self.book_copy.status = BookStatus.REPAIRING
        elif new_status == RepairStatus.COMPLETED:
            self.completed_at = now
            self.book_copy.status = BookStatus.AVAILABLE
        elif new_status == RepairStatus.SCRAPPED:
            self.book_copy.status = BookStatus.LOST
        
        self.book_copy.save()
        self.save()
        
        if 'photo' in kwargs and kwargs['photo']:
            RepairPhoto.objects.create(
                repair_record=self,
                photo=kwargs['photo'],
                description=kwargs.get('photo_description', ''),
                stage=new_status,
                uploaded_by=kwargs.get('uploaded_by')
            )
        
        return self


class RepairPhoto(BaseModel):
    repair_record = models.ForeignKey(RepairRecord, on_delete=models.CASCADE, related_name='photos', verbose_name='修复记录')
    photo = models.ImageField(upload_to='repairs/', verbose_name='照片')
    description = models.CharField(max_length=255, blank=True, verbose_name='照片说明')
    stage = models.CharField(max_length=20, choices=RepairStatus.choices, verbose_name='修复阶段')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='上传人')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')

    class Meta:
        db_table = 'repairs_repair_photo'
        verbose_name = '修复照片'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.repair_record} - {self.get_stage_display()}'


class RepairProgressLog(BaseModel):
    repair_record = models.ForeignKey(RepairRecord, on_delete=models.CASCADE, related_name='progress_logs', verbose_name='修复记录')
    status = models.CharField(max_length=20, choices=RepairStatus.choices, verbose_name='状态')
    notes = models.TextField(blank=True, verbose_name='进度说明')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        db_table = 'repairs_progress_log'
        verbose_name = '修复进度日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
