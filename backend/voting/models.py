from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel
from common.managers import ProductionDataManager, TestDataManager
from topics.models import Topic


class Vote(BaseModel):
    VOTE_CHOICES = (
        ('yes', '赞成'),
        ('no', '反对'),
        ('abstain', '弃权'),
    )

    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='votes',
        verbose_name='议题'
    )
    voter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='votes',
        verbose_name='投票人'
    )
    vote = models.CharField(max_length=10, choices=VOTE_CHOICES, verbose_name='投票选项')
    voted_at = models.DateTimeField(default=timezone.now, verbose_name='投票时间')
    is_anonymous = models.BooleanField(default=False, verbose_name='是否匿名')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')
    user_agent = models.TextField(blank=True, verbose_name='用户代理')
    has_qualification_exception = models.BooleanField(default=False, verbose_name='是否存在资格异常')
    exception_handled = models.BooleanField(default=False, verbose_name='异常是否已处理')
    exception_remark = models.TextField(blank=True, verbose_name='异常备注')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '投票记录'
        verbose_name_plural = verbose_name
        unique_together = ['topic', 'voter']
        ordering = ['-voted_at']

    def __str__(self):
        return f'{self.voter.get_full_name()} 对 {self.topic.title} 投了 {self.get_vote_display()}'

    def save(self, *args, **kwargs):
        from residents.models import Resident
        try:
            resident = Resident.objects.get(user=self.voter)
            if not resident.is_voter_qualified:
                self.has_qualification_exception = True
        except Resident.DoesNotExist:
            self.has_qualification_exception = True
        super().save(*args, **kwargs)

        if self.has_qualification_exception and not self.exception_handled:
            from voting.tasks import handle_qualification_exception
            handle_qualification_exception.delay(self.id)


class VotingStatistics(BaseModel):
    topic = models.OneToOneField(
        Topic,
        on_delete=models.CASCADE,
        related_name='statistics',
        verbose_name='议题'
    )
    total_eligible_voters = models.IntegerField(default=0, verbose_name='有资格投票人数')
    actual_voters = models.IntegerField(default=0, verbose_name='实际投票人数')
    turnout_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='投票率')
    yes_votes = models.IntegerField(default=0, verbose_name='赞成票')
    no_votes = models.IntegerField(default=0, verbose_name='反对票')
    abstain_votes = models.IntegerField(default=0, verbose_name='弃权票')
    yes_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='赞成率')
    no_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='反对率')
    abstain_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='弃权率')
    exception_count = models.IntegerField(default=0, verbose_name='资格异常数')
    last_updated = models.DateTimeField(auto_now=True, verbose_name='最后更新时间')

    class Meta:
        verbose_name = '投票统计'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.topic.title} - 投票统计'

    def update_statistics(self):
        votes = self.topic.votes.all()
        self.actual_voters = votes.count()
        self.yes_votes = votes.filter(vote='yes').count()
        self.no_votes = votes.filter(vote='no').count()
        self.abstain_votes = votes.filter(vote='abstain').count()
        self.exception_count = votes.filter(has_qualification_exception=True).count()

        from residents.models import Resident
        self.total_eligible_voters = Resident.objects.filter(
            is_voter_qualified=True,
            user__community=self.topic.community
        ).count() if self.topic.community else Resident.objects.filter(
            is_voter_qualified=True
        ).count()

        if self.total_eligible_voters > 0:
            self.turnout_rate = (self.actual_voters / self.total_eligible_voters) * 100

        if self.actual_voters > 0:
            self.yes_rate = (self.yes_votes / self.actual_voters) * 100
            self.no_rate = (self.no_votes / self.actual_voters) * 100
            self.abstain_rate = (self.abstain_votes / self.actual_voters) * 100

        self.save()
