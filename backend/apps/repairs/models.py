from django.db import models
from django.conf import settings
from apps.users.models import User


class RepairStatus(models.TextChoices):
    PENDING = 'pending', '待处理'
    ASSIGNED = 'assigned', '已分配'
    IN_PROGRESS = 'in_progress', '处理中'
    COMPLETED = 'completed', '已完成'
    CANCELLED = 'cancelled', '已取消'


class RepairType(models.TextChoices):
    PLUMBING = 'plumbing', '水电维修'
    FURNITURE = 'furniture', '家具维修'
    ELECTRICAL = 'electrical', '电器维修'
    DOOR_WINDOW = 'door_window', '门窗维修'
    NETWORK = 'network', '网络维修'
    OTHER = 'other', '其他'


class RepairPriority(models.TextChoices):
    LOW = 'low', '低'
    MEDIUM = 'medium', '中'
    HIGH = 'high', '高'
    URGENT = 'urgent', '紧急'


class RepairRequest(models.Model):
    title = models.CharField(max_length=200, verbose_name='报修标题')
    description = models.TextField(verbose_name='详细描述')
    repair_type = models.CharField(max_length=30, choices=RepairType.choices, verbose_name='报修类型')
    priority = models.CharField(max_length=20, choices=RepairPriority.choices, default=RepairPriority.MEDIUM, verbose_name='优先级')
    status = models.CharField(max_length=20, choices=RepairStatus.choices, default=RepairStatus.PENDING, verbose_name='处理状态')
    dorm_building = models.CharField(max_length=50, verbose_name='宿舍楼')
    dorm_room = models.CharField(max_length=20, verbose_name='宿舍号')
    contact_name = models.CharField(max_length=50, verbose_name='联系人')
    contact_phone = models.CharField(max_length=20, verbose_name='联系电话')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='repair_requests', verbose_name='申请人')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_repairs', verbose_name='处理人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    expected_date = models.DateField(null=True, blank=True, verbose_name='预计完成日期')

    class Meta:
        verbose_name = '报修申请'
        verbose_name_plural = '报修申请'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} - {self.get_status_display()}'

    @property
    def processing_time(self):
        if self.completed_at:
            return (self.completed_at - self.created_at).total_seconds() / 3600
        return None


class RepairPhoto(models.Model):
    repair_request = models.ForeignKey(RepairRequest, on_delete=models.CASCADE, related_name='photos', verbose_name='报修申请')
    image = models.ImageField(upload_to='repair_photos/', verbose_name='照片')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')

    class Meta:
        verbose_name = '报修照片'
        verbose_name_plural = '报修照片'

    def __str__(self):
        return f'{self.repair_request.title} - 照片'


class RepairProgress(models.Model):
    repair_request = models.ForeignKey(RepairRequest, on_delete=models.CASCADE, related_name='progresses', verbose_name='报修申请')
    status = models.CharField(max_length=20, choices=RepairStatus.choices, verbose_name='状态')
    remark = models.TextField(blank=True, verbose_name='备注')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '报修处理进度'
        verbose_name_plural = '报修处理进度'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.repair_request.title} - {self.get_status_display()}'


class RepairComment(models.Model):
    repair_request = models.ForeignKey(RepairRequest, on_delete=models.CASCADE, related_name='comments', verbose_name='报修申请')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='评论人')
    content = models.TextField(verbose_name='评论内容')
    rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)], verbose_name='评分')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='评论时间')

    class Meta:
        verbose_name = '报修评价'
        verbose_name_plural = '报修评价'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.repair_request.title}'
