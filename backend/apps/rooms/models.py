from django.db import models
from apps.users.models import User


class StudyRoom(models.Model):
    name = models.CharField(max_length=100, verbose_name='自习室名称')
    building = models.CharField(max_length=50, verbose_name='所在楼栋')
    floor = models.IntegerField(verbose_name='楼层')
    total_seats = models.IntegerField(verbose_name='总座位数')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    open_time = models.TimeField(default='07:00', verbose_name='开放时间')
    close_time = models.TimeField(default='22:00', verbose_name='关闭时间')
    description = models.TextField(blank=True, verbose_name='描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '自习室'
        verbose_name_plural = '自习室'
        ordering = ['building', 'floor', 'name']

    def __str__(self):
        return f'{self.building}-{self.name}'


class Seat(models.Model):
    study_room = models.ForeignKey(StudyRoom, on_delete=models.CASCADE, related_name='seats', verbose_name='自习室')
    seat_number = models.CharField(max_length=20, verbose_name='座位号')
    row = models.IntegerField(null=True, blank=True, verbose_name='行')
    col = models.IntegerField(null=True, blank=True, verbose_name='列')
    has_power = models.BooleanField(default=False, verbose_name='是否有电源')
    has_window = models.BooleanField(default=False, verbose_name='是否靠窗')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')

    class Meta:
        verbose_name = '座位'
        verbose_name_plural = '座位'
        unique_together = ['study_room', 'seat_number']
        ordering = ['study_room', 'seat_number']

    def __str__(self):
        return f'{self.study_room.name}-{self.seat_number}'

    def is_occupied(self, date=None):
        from django.utils import timezone
        if date is None:
            date = timezone.now().date()
        return self.reservations.filter(
            date=date,
            status__in=['reserved', 'checked_in']
        ).exists()


class SeatReservation(models.Model):
    STATUS_CHOICES = [
        ('reserved', '已预约'),
        ('checked_in', '已签到'),
        ('cancelled', '已取消'),
        ('no_show', '未签到'),
        ('completed', '已完成'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seat_reservations', verbose_name='预约人')
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name='reservations', verbose_name='座位')
    date = models.DateField(verbose_name='预约日期')
    start_time = models.TimeField(verbose_name='开始时间')
    end_time = models.TimeField(verbose_name='结束时间')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reserved', verbose_name='状态')
    reserved_at = models.DateTimeField(auto_now_add=True, verbose_name='预约时间')
    checked_in_at = models.DateTimeField(null=True, blank=True, verbose_name='签到时间')
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name='取消时间')
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_reservations', verbose_name='取消人')

    class Meta:
        verbose_name = '座位预约'
        verbose_name_plural = '座位预约'
        ordering = ['-date', '-reserved_at']

    def __str__(self):
        return f'{self.user} - {self.seat} - {self.date}'


class CheckInRecord(models.Model):
    TYPE_CHOICES = [
        ('seat', '座位签到'),
        ('activity', '活动签到'),
        ('duty', '值班签到'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='checkins', verbose_name='签到人')
    checkin_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='seat', verbose_name='签到类型')
    reservation = models.ForeignKey(SeatReservation, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='关联预约')
    location = models.CharField(max_length=200, blank=True, verbose_name='签到地点')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='签到时间')

    class Meta:
        verbose_name = '签到记录'
        verbose_name_plural = '签到记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.get_checkin_type_display()} - {self.created_at}'
