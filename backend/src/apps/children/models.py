from django.db import models
from core.models import BaseModel


class ChildClass(BaseModel):
    name = models.CharField('班级名称', max_length=50)
    capacity = models.IntegerField('容量', default=20)
    description = models.TextField('班级描述', blank=True)

    class Meta:
        verbose_name = '班级'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name


class Child(BaseModel):
    GENDER_CHOICES = (
        ('male', '男'),
        ('female', '女'),
    )
    STATUS_CHOICES = (
        ('active', '在园'),
        ('graduated', '毕业'),
        ('suspended', '休学'),
    )
    name = models.CharField('姓名', max_length=50)
    gender = models.CharField('性别', max_length=10, choices=GENDER_CHOICES)
    birth_date = models.DateField('出生日期')
    id_card = models.CharField('身份证号', max_length=18, blank=True)
    avatar = models.ImageField('头像', upload_to='children/', null=True, blank=True)
    child_class = models.ForeignKey(ChildClass, on_delete=models.SET_NULL, null=True, related_name='children', verbose_name='所属班级')
    enrollment_date = models.DateField('入园日期')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    allergies = models.TextField('过敏史', blank=True)
    medical_notes = models.TextField('医疗备注', blank=True)
    emergency_contact = models.CharField('紧急联系人', max_length=50)
    emergency_phone = models.CharField('紧急联系电话', max_length=20)
    parents = models.ManyToManyField('accounts.User', related_name='children', through='children.ParentChildRelation', verbose_name='家长')

    class Meta:
        verbose_name = '儿童档案'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))


class ParentChildRelation(BaseModel):
    parent = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='child_relations')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='parent_relations')
    relation = models.CharField('关系', max_length=20, default='父亲')
    is_primary = models.BooleanField('主要联系人', default=False)

    class Meta:
        verbose_name = '亲子关系'
        verbose_name_plural = verbose_name
        unique_together = ('parent', 'child')

    def __str__(self):
        return f'{self.parent.name} - {self.child.name}'


class AuthorizedPickupPerson(BaseModel):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='authorized_persons', verbose_name='儿童')
    name = models.CharField('姓名', max_length=50)
    phone = models.CharField('手机号', max_length=20)
    id_card = models.CharField('身份证号', max_length=18, blank=True)
    relation = models.CharField('关系', max_length=20)
    photo = models.ImageField('照片', upload_to='authorized_persons/', null=True, blank=True)
    is_active = models.BooleanField('是否有效', default=True)
    expires_at = models.DateTimeField('过期时间', null=True, blank=True)

    class Meta:
        verbose_name = '授权接送人'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.name}({self.relation}) - {self.child.name}'
