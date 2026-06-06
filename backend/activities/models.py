from django.db import models
from members.models import Member

class ActivityStatus(models.TextChoices):
    UPCOMING = 'upcoming', '即将开始'
    ONGOING = 'ongoing', '进行中'
    ENDED = 'ended', '已结束'
    CANCELLED = 'cancelled', '已取消'

class RegistrationStatus(models.TextChoices):
    CONFIRMED = 'confirmed', '已确认'
    WAITLIST = 'waitlist', '候补中'
    CANCELLED = 'cancelled', '已取消'
    ATTENDED = 'attended', '已参加'

class Activity(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    activity_type = models.CharField(max_length=50, default='storytelling')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=100)
    max_capacity = models.IntegerField(default=20)
    current_capacity = models.IntegerField(default=0)
    waitlist_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=ActivityStatus.choices, default=ActivityStatus.UPCOMING)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'activities'

    def __str__(self):
        return self.title

    def has_capacity(self):
        return self.current_capacity < self.max_capacity

    def is_almost_full(self):
        return self.current_capacity >= self.max_capacity * 0.8

    def register(self, member):
        if self.status != ActivityStatus.UPCOMING:
            return None, '活动已结束或取消'
        
        existing = Registration.objects.filter(activity=self, member=member).exclude(
            status=RegistrationStatus.CANCELLED
        ).first()
        if existing:
            return None, '已报名或候补该活动'

        if self.has_capacity():
            reg = Registration.objects.create(
                activity=self,
                member=member,
                status=RegistrationStatus.CONFIRMED
            )
            self.current_capacity += 1
            self.save()
            return reg, '报名成功'
        else:
            reg = Registration.objects.create(
                activity=self,
                member=member,
                status=RegistrationStatus.WAITLIST
            )
            self.waitlist_count += 1
            self.save()
            reg.waitlist_position = self.waitlist_count
            reg.save()
            return reg, f'已加入候补，排位第{reg.waitlist_position}'

    def cancel_registration(self, registration):
        if registration.status == RegistrationStatus.CONFIRMED:
            self.current_capacity -= 1
            registration.status = RegistrationStatus.CANCELLED
            registration.save()
            self.save()
            self._promote_waitlist()
            return True
        elif registration.status == RegistrationStatus.WAITLIST:
            registration.status = RegistrationStatus.CANCELLED
            registration.save()
            self.waitlist_count -= 1
            self._reorder_waitlist()
            self.save()
            return True
        return False

    def _promote_waitlist(self):
        waitlist = Registration.objects.filter(
            activity=self,
            status=RegistrationStatus.WAITLIST
        ).order_by('waitlist_position', 'create_time')
        
        while self.has_capacity() and waitlist.exists():
            next_reg = waitlist.first()
            next_reg.status = RegistrationStatus.CONFIRMED
            next_reg.waitlist_position = None
            next_reg.save()
            self.current_capacity += 1
            self.waitlist_count -= 1
            self.save()
            waitlist = waitlist.exclude(id=next_reg.id)
        self._reorder_waitlist()

    def _reorder_waitlist(self):
        waitlist = Registration.objects.filter(
            activity=self,
            status=RegistrationStatus.WAITLIST
        ).order_by('create_time')
        for idx, reg in enumerate(waitlist, 1):
            reg.waitlist_position = idx
            reg.save()

class Registration(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='registrations')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=20, choices=RegistrationStatus.choices)
    waitlist_position = models.IntegerField(blank=True, null=True)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'registrations'
        ordering = ['-create_time']

    def __str__(self):
        return f"{self.member.family_name} - {self.activity.title}"
