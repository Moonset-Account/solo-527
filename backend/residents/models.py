from django.db import models
from django.conf import settings
from common.models import BaseModel, ProcessRecord
from common.managers import ProductionDataManager, TestDataManager


class Resident(BaseModel):
    HOUSEHOLD_TYPE_CHOICES = (
        ('ordinary', '普通家庭'),
        ('low_income', '低保家庭'),
        ('disabled', '残疾人家庭'),
        ('elderly', '空巢老人家庭'),
        ('single_parent', '单亲家庭'),
        ('special', '特殊困难家庭'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resident_profile',
        verbose_name='关联用户'
    )
    household_type = models.CharField(
        max_length=20,
        choices=HOUSEHOLD_TYPE_CHOICES,
        default='ordinary',
        verbose_name='家庭类型'
    )
    household_member_count = models.IntegerField(default=1, verbose_name='家庭人数')
    is_voter_qualified = models.BooleanField(default=True, verbose_name='是否有投票资格')
    qualification_exception_reason = models.TextField(blank=True, verbose_name='资格异常原因')
    registered_address = models.CharField(max_length=255, blank=True, verbose_name='户籍地址')
    residence_address = models.CharField(max_length=255, blank=True, verbose_name='居住地址')
    household_register_type = models.CharField(max_length=50, blank=True, verbose_name='户口性质')
    ethnicity = models.CharField(max_length=50, blank=True, verbose_name='民族')
    political_status = models.CharField(max_length=50, blank=True, verbose_name='政治面貌')
    occupation = models.CharField(max_length=100, blank=True, verbose_name='职业')
    work_unit = models.CharField(max_length=255, blank=True, verbose_name='工作单位')
    education_level = models.CharField(max_length=50, blank=True, verbose_name='文化程度')
    marital_status = models.CharField(max_length=20, blank=True, verbose_name='婚姻状况')
    birthday = models.DateField(null=True, blank=True, verbose_name='出生日期')
    age = models.IntegerField(null=True, blank=True, verbose_name='年龄')
    gender = models.CharField(max_length=10, choices=(('male', '男'), ('female', '女')), blank=True, verbose_name='性别')
    contact_person = models.CharField(max_length=100, blank=True, verbose_name='紧急联系人')
    contact_phone = models.CharField(max_length=20, blank=True, verbose_name='紧急联系电话')
    health_status = models.CharField(max_length=100, blank=True, verbose_name='健康状况')
    has_volunteer_experience = models.BooleanField(default=False, verbose_name='是否有志愿者经历')
    skills = models.TextField(blank=True, verbose_name='特长技能')
    remarks = models.TextField(blank=True, verbose_name='备注')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '居民台账'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.get_full_name() or self.user.username} - {self.get_household_type_display()}'


class ResidentProcessRecord(ProcessRecord):
    resident = models.ForeignKey(
        Resident,
        on_delete=models.CASCADE,
        related_name='process_records',
        verbose_name='居民'
    )

    class Meta:
        verbose_name = '居民处理记录'
        verbose_name_plural = verbose_name


class HouseholdMember(BaseModel):
    resident = models.ForeignKey(
        Resident,
        on_delete=models.CASCADE,
        related_name='household_members',
        verbose_name='户主'
    )
    name = models.CharField(max_length=100, verbose_name='姓名')
    relation = models.CharField(max_length=50, verbose_name='与户主关系')
    id_card = models.CharField(max_length=18, blank=True, verbose_name='身份证号')
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    birthday = models.DateField(null=True, blank=True, verbose_name='出生日期')
    gender = models.CharField(max_length=10, choices=(('male', '男'), ('female', '女')), blank=True, verbose_name='性别')
    education_level = models.CharField(max_length=50, blank=True, verbose_name='文化程度')
    occupation = models.CharField(max_length=100, blank=True, verbose_name='职业')
    work_unit = models.CharField(max_length=255, blank=True, verbose_name='工作单位')
    is_voter_qualified = models.BooleanField(default=True, verbose_name='是否有投票资格')
    remarks = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '家庭成员'
        verbose_name_plural = verbose_name
        ordering = ['resident', 'id']

    def __str__(self):
        return f'{self.name} - {self.relation}'
