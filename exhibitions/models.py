from django.db import models
from django.utils import timezone


class ExhibitionHall(models.Model):
    name = models.CharField(max_length=100, verbose_name='展厅名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='展厅编码')
    floor = models.CharField(max_length=50, blank=True, verbose_name='楼层')
    area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='面积(㎡)')
    capacity = models.IntegerField(null=True, blank=True, verbose_name='容量')
    description = models.TextField(blank=True, verbose_name='描述')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')

    class Meta:
        verbose_name = '展厅'
        verbose_name_plural = '展厅'
        ordering = ['code']

    def __str__(self):
        return self.name


class Exhibition(models.Model):
    DRAFT = 'draft'
    PLANNING = 'planning'
    INSTALLATION = 'installation'
    OPEN = 'open'
    CLOSED = 'closed'
    ARCHIVED = 'archived'

    STATUS_CHOICES = [
        (DRAFT, '草稿'),
        (PLANNING, '规划中'),
        (INSTALLATION, '布展中'),
        (OPEN, '已开幕'),
        (CLOSED, '已闭展'),
        (ARCHIVED, '已归档'),
    ]

    name = models.CharField(max_length=200, verbose_name='展览名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='展览编码')
    hall = models.ForeignKey(ExhibitionHall, on_delete=models.PROTECT, related_name='exhibitions', verbose_name='展厅')
    curator = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='curated_exhibitions', verbose_name='策展人')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=DRAFT, verbose_name='状态')
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    installation_start = models.DateField(null=True, blank=True, verbose_name='布展开始日期')
    installation_end = models.DateField(null=True, blank=True, verbose_name='布展结束日期')
    opening_date = models.DateField(null=True, blank=True, verbose_name='开幕日期')
    closing_date = models.DateField(null=True, blank=True, verbose_name='闭展日期')
    description = models.TextField(blank=True, verbose_name='展览描述')
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='created_exhibitions', verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '展览'
        verbose_name_plural = '展览'
        ordering = ['-start_date']

    def __str__(self):
        return self.name

    def get_status_display_name(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    def is_open(self):
        return self.status == self.OPEN

    def can_modify_borrow_records(self):
        return self.status in [self.DRAFT, self.PLANNING, self.INSTALLATION]


class BorrowOrder(models.Model):
    DRAFT = 'draft'
    PENDING_APPROVAL = 'pending_approval'
    APPROVED = 'approved'
    PICKED_UP = 'picked_up'
    PARTIAL_RETURNED = 'partial_returned'
    RETURNED = 'returned'
    CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (DRAFT, '草稿'),
        (PENDING_APPROVAL, '待审批'),
        (APPROVED, '已批准'),
        (PICKED_UP, '已领取'),
        (PARTIAL_RETURNED, '部分归还'),
        (RETURNED, '已归还'),
        (CANCELLED, '已取消'),
    ]

    BORROW = 'borrow'
    TEMPORARY = 'temporary'

    TYPE_CHOICES = [
        (BORROW, '正常借用'),
        (TEMPORARY, '临时追加'),
    ]

    order_no = models.CharField(max_length=50, unique=True, verbose_name='借单号')
    exhibition = models.ForeignKey(Exhibition, on_delete=models.CASCADE, related_name='borrow_orders', verbose_name='展览')
    hall = models.ForeignKey(ExhibitionHall, on_delete=models.PROTECT, related_name='borrow_orders', verbose_name='使用展厅')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=BORROW, verbose_name='借用类型')
    requester = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='requested_orders', verbose_name='申请人')
    construction_lead = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_orders', verbose_name='施工负责人')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=DRAFT, verbose_name='状态')
    is_cross_hall = models.BooleanField(default=False, verbose_name='是否跨展厅借用')
    requires_approval = models.BooleanField(default=False, verbose_name='需要审批')
    first_confirmer = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='first_confirmed_orders', verbose_name='第一确认人')
    first_confirm_time = models.DateTimeField(null=True, blank=True, verbose_name='第一确认时间')
    second_confirmer = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='second_confirmed_orders', verbose_name='第二确认人(贵重物品)')
    second_confirm_time = models.DateTimeField(null=True, blank=True, verbose_name='第二确认时间')
    approver = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_orders', verbose_name='审批人')
    approval_time = models.DateTimeField(null=True, blank=True, verbose_name='审批时间')
    approval_remarks = models.TextField(blank=True, verbose_name='审批备注')
    expected_pickup_date = models.DateField(verbose_name='预计领取日期')
    expected_return_date = models.DateField(verbose_name='预计归还日期')
    actual_pickup_date = models.DateTimeField(null=True, blank=True, verbose_name='实际领取时间')
    actual_return_date = models.DateTimeField(null=True, blank=True, verbose_name='实际归还时间')
    remarks = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '借用单'
        verbose_name_plural = '借用单'
        ordering = ['-created_at']

    def __str__(self):
        return self.order_no

    def get_status_display_name(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    def get_type_display_name(self):
        return dict(self.TYPE_CHOICES).get(self.type, self.type)

    def has_valuable_items(self):
        return self.items.filter(material__is_valuable=True).exists()

    def is_double_confirmed(self):
        return self.first_confirmer and self.second_confirmer

    def can_be_picked_up(self):
        if self.status != self.APPROVED:
            return False
        if not self.is_reservation_confirmed():
            return False
        if self.has_valuable_items() and not self.is_double_confirmed():
            return False
        return True

    def is_reservation_confirmed(self):
        from inventory.models import InventoryReservation
        reservations = InventoryReservation.objects.filter(borrow_order=self)
        if not reservations.exists():
            return False
        return reservations.exclude(status=InventoryReservation.CONFIRMED).count() == 0

    def is_overdue(self):
        if self.status in [self.PICKED_UP, self.PARTIAL_RETURNED]:
            return timezone.now().date() > self.expected_return_date
        return False


class BorrowItem(models.Model):
    PENDING = 'pending'
    PICKED_UP = 'picked_up'
    RETURNED = 'returned'
    DAMAGED = 'damaged'
    LOST = 'lost'

    STATUS_CHOICES = [
        (PENDING, '待领取'),
        (PICKED_UP, '已领取'),
        (RETURNED, '已归还'),
        (DAMAGED, '损坏'),
        (LOST, '丢失'),
    ]

    borrow_order = models.ForeignKey(BorrowOrder, on_delete=models.CASCADE, related_name='items', verbose_name='借用单')
    material = models.ForeignKey('inventory.Material', on_delete=models.PROTECT, related_name='borrow_items', verbose_name='物料')
    inventory_item = models.ForeignKey('inventory.InventoryItem', on_delete=models.SET_NULL, null=True, blank=True, related_name='borrow_items', verbose_name='具体库存项')
    quantity = models.IntegerField(default=1, verbose_name='数量')
    picked_up_quantity = models.IntegerField(default=0, verbose_name='已领取数量')
    returned_quantity = models.IntegerField(default=0, verbose_name='已归还数量')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=PENDING, verbose_name='状态')
    pickup_time = models.DateTimeField(null=True, blank=True, verbose_name='领取时间')
    return_time = models.DateTimeField(null=True, blank=True, verbose_name='归还时间')
    returned_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='returned_items', verbose_name='归还人')
    remarks = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '借用明细'
        verbose_name_plural = '借用明细'

    def __str__(self):
        return f'{self.borrow_order.order_no} - {self.material.name}'

    def get_status_display_name(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    def is_returned(self):
        return self.returned_quantity >= self.quantity


class ApprovalRecord(models.Model):
    APPROVE = 'approve'
    REJECT = 'reject'
    TRANSFER = 'transfer'

    ACTION_CHOICES = [
        (APPROVE, '同意'),
        (REJECT, '拒绝'),
        (TRANSFER, '转交'),
    ]

    borrow_order = models.ForeignKey(BorrowOrder, on_delete=models.CASCADE, related_name='approval_records', verbose_name='借用单')
    approver = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='approval_records', verbose_name='审批人')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='审批动作')
    remarks = models.TextField(blank=True, verbose_name='审批意见')
    next_approver = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='transfer_approvals', verbose_name='转交审批人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='审批时间')

    class Meta:
        verbose_name = '审批记录'
        verbose_name_plural = '审批记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.borrow_order.order_no} - {self.approver} - {self.get_action_display()}'

    def get_action_display_name(self):
        return dict(self.ACTION_CHOICES).get(self.action, self.action)


class TransportRecord(models.Model):
    PENDING = 'pending'
    IN_TRANSIT = 'in_transit'
    DELIVERED = 'delivered'
    RETURNED = 'returned'

    STATUS_CHOICES = [
        (PENDING, '待运输'),
        (IN_TRANSIT, '运输中'),
        (DELIVERED, '已送达'),
        (RETURNED, '已退回'),
    ]

    borrow_order = models.ForeignKey(BorrowOrder, on_delete=models.CASCADE, related_name='transport_records', verbose_name='借用单')
    tracking_no = models.CharField(max_length=100, blank=True, verbose_name='运单号')
    from_location = models.CharField(max_length=200, verbose_name='出发地')
    to_location = models.CharField(max_length=200, verbose_name='目的地')
    carrier = models.CharField(max_length=100, blank=True, verbose_name='承运人')
    driver = models.CharField(max_length=100, blank=True, verbose_name='司机')
    driver_phone = models.CharField(max_length=20, blank=True, verbose_name='司机电话')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=PENDING, verbose_name='状态')
    estimated_departure = models.DateTimeField(null=True, blank=True, verbose_name='预计出发时间')
    actual_departure = models.DateTimeField(null=True, blank=True, verbose_name='实际出发时间')
    estimated_arrival = models.DateTimeField(null=True, blank=True, verbose_name='预计到达时间')
    actual_arrival = models.DateTimeField(null=True, blank=True, verbose_name='实际到达时间')
    remarks = models.TextField(blank=True, verbose_name='备注')
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='created_transports', verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '运输记录'
        verbose_name_plural = '运输记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.tracking_no or self.id} - {self.get_status_display_name()}'

    def get_status_display_name(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
