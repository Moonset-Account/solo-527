from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User


class Benefit(models.Model):
    BENEFIT_TYPE_CHOICES = (
        ('service', '服务项目'),
        ('discount', '折扣优惠'),
        ('points', '积分奖励'),
        ('gift', '赠品'),
        ('priority', '优先权'),
        ('other', '其他'),
    )
    
    name = models.CharField(_('权益名称'), max_length=100)
    description = models.TextField(_('权益描述'), null=True, blank=True)
    benefit_type = models.CharField(_('权益类型'), max_length=20, choices=BENEFIT_TYPE_CHOICES)
    value = models.DecimalField(_('权益值'), max_digits=10, decimal_places=2, null=True, blank=True)
    unit = models.CharField(_('单位'), max_length=20, null=True, blank=True)
    is_active = models.BooleanField(_('是否启用'), default=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('权益项')
        verbose_name_plural = _('权益项')

    def __str__(self):
        return f'{self.get_benefit_type_display()} - {self.name}'


class MembershipPackage(models.Model):
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('active', '上架'),
        ('inactive', '下架'),
    )
    
    DURATION_UNIT_CHOICES = (
        ('day', '天'),
        ('month', '月'),
        ('year', '年'),
        ('unlimited', '永久'),
    )
    
    name = models.CharField(_('套餐名称'), max_length=200)
    description = models.TextField(_('套餐描述'), null=True, blank=True)
    short_description = models.CharField(_('简短描述'), max_length=500, null=True, blank=True)
    price = models.DecimalField(_('售价'), max_digits=10, decimal_places=2)
    original_price = models.DecimalField(_('原价'), max_digits=10, decimal_places=2, null=True, blank=True)
    duration_value = models.IntegerField(_('有效期值'), default=1)
    duration_unit = models.CharField(_('有效期单位'), max_length=20, choices=DURATION_UNIT_CHOICES, default='month')
    benefits = models.ManyToManyField(Benefit, through='PackageBenefit', related_name='packages')
    service_count = models.IntegerField(_('服务次数'), default=0)
    status = models.CharField(_('状态'), max_length=20, choices=STATUS_CHOICES, default='draft')
    sort_order = models.IntegerField(_('排序'), default=0)
    is_popular = models.BooleanField(_('热门推荐'), default=False)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['sort_order', '-created_at']
        verbose_name = _('会员套餐')
        verbose_name_plural = _('会员套餐')

    def __str__(self):
        return f'{self.name} - ¥{self.price}'


class PackageBenefit(models.Model):
    package = models.ForeignKey(MembershipPackage, on_delete=models.CASCADE, related_name='package_benefits')
    benefit = models.ForeignKey(Benefit, on_delete=models.CASCADE, related_name='benefit_packages')
    quantity = models.IntegerField(_('数量'), default=1)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        unique_together = ('package', 'benefit')
        verbose_name = _('套餐权益关联')
        verbose_name_plural = _('套餐权益关联')


class MemberMembership(models.Model):
    STATUS_CHOICES = (
        ('active', '有效'),
        ('expired', '已过期'),
        ('cancelled', '已取消'),
        ('frozen', '已冻结'),
    )
    
    member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    package = models.ForeignKey(MembershipPackage, on_delete=models.PROTECT, related_name='member_packages')
    start_date = models.DateField(_('开始日期'))
    end_date = models.DateField(_('结束日期'))
    remaining_services = models.IntegerField(_('剩余服务次数'), default=0)
    total_services = models.IntegerField(_('总服务次数'), default=0)
    status = models.CharField(_('状态'), max_length=20, choices=STATUS_CHOICES, default='active')
    purchase_order = models.OneToOneField('payments.PaymentOrder', on_delete=models.SET_NULL, null=True, blank=True, related_name='membership')
    is_auto_renew = models.BooleanField(_('自动续费'), default=False)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('用户会员')
        verbose_name_plural = _('用户会员')

    def __str__(self):
        return f'{self.member.username} - {self.package.name}'


class BenefitUsageRecord(models.Model):
    membership = models.ForeignKey(MemberMembership, on_delete=models.CASCADE, related_name='usage_records')
    benefit = models.ForeignKey(Benefit, on_delete=models.PROTECT, related_name='usage_records')
    service_record = models.ForeignKey('services.ServiceRecord', on_delete=models.SET_NULL, null=True, blank=True, related_name='benefit_usages')
    quantity_used = models.IntegerField(_('使用数量'), default=1)
    used_at = models.DateTimeField(_('使用时间'), auto_now_add=True)
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='benefit_operations')
    remark = models.TextField(_('备注'), null=True, blank=True)

    class Meta:
        ordering = ['-used_at']
        verbose_name = _('权益使用记录')
        verbose_name_plural = _('权益使用记录')

    def __str__(self):
        return f'{self.membership.member.username} 使用 {self.benefit.name}'
