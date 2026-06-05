from django.db import models
from django.conf import settings


class ClassGroup(models.Model):
    name = models.CharField('班级名称', max_length=50)
    grade = models.CharField('年级', max_length=50, blank=True, default='')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='class_groups',
        limit_choices_to={'role': 'teacher'},
        verbose_name='主班教师',
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'children_classgroup'
        verbose_name = '班级'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['teacher'], name='idx_classgroup_teacher'),
        ]

    def __str__(self):
        return self.name


class Child(models.Model):
    GENDER_CHOICES = [
        ('M', '男'),
        ('F', '女'),
    ]
    name = models.CharField('姓名', max_length=50)
    gender = models.CharField('性别', max_length=1, choices=GENDER_CHOICES, default='M')
    birth_date = models.DateField('出生日期')
    class_group = models.ForeignKey(
        ClassGroup, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='children',
        verbose_name='所属班级',
    )
    enrollment_date = models.DateField('入园日期', null=True, blank=True)
    allergies = models.TextField('过敏信息', blank=True, default='')
    medical_notes = models.TextField('医疗备注', blank=True, default='')
    emergency_contact = models.CharField('紧急联系人', max_length=50, blank=True, default='')
    emergency_phone = models.CharField('紧急联系电话', max_length=20, blank=True, default='')
    is_active = models.BooleanField('在园', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'children_child'
        verbose_name = '儿童'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['class_group', 'is_active'], name='idx_child_class_active'),
            models.Index(fields=['name'], name='idx_child_name'),
        ]

    def __str__(self):
        return self.name


class ParentChildRelation(models.Model):
    RELATION_CHOICES = [
        ('father', '父亲'),
        ('mother', '母亲'),
        ('grandfather', '爷爷/外公'),
        ('grandmother', '奶奶/外婆'),
        ('other', '其他'),
    ]
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='children_relations', verbose_name='家长',
    )
    child = models.ForeignKey(
        Child, on_delete=models.CASCADE,
        related_name='parent_relations', verbose_name='儿童',
    )
    relation = models.CharField('关系', max_length=20, choices=RELATION_CHOICES, default='mother')
    is_primary = models.BooleanField('主要联系人', default=False)

    class Meta:
        db_table = 'children_parentchildrelation'
        verbose_name = '家长-儿童关系'
        verbose_name_plural = verbose_name
        unique_together = [('parent', 'child')]
        indexes = [
            models.Index(fields=['parent'], name='idx_pcr_parent'),
            models.Index(fields=['child'], name='idx_pcr_child'),
        ]

    def __str__(self):
        return f'{self.parent.username} - {self.child.name} ({self.get_relation_display()})'


class AuthorizedPickupPerson(models.Model):
    child = models.ForeignKey(
        Child, on_delete=models.CASCADE,
        related_name='authorized_pickups', verbose_name='儿童',
    )
    name = models.CharField('姓名', max_length=50)
    relation = models.CharField('与儿童关系', max_length=30, blank=True, default='')
    id_number = models.CharField('身份证号', max_length=18, blank=True, default='')
    phone = models.CharField('联系电话', max_length=20, blank=True, default='')
    photo = models.ImageField('照片', upload_to='pickup_persons/', blank=True, null=True)
    is_active = models.BooleanField('有效', default=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, verbose_name='添加人',
    )
    created_at = models.DateTimeField('添加时间', auto_now_add=True)

    class Meta:
        db_table = 'children_authorizedpickupperson'
        verbose_name = '授权接送人'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['child', 'is_active'], name='idx_pickup_child_active'),
        ]

    def __str__(self):
        return f'{self.child.name} - {self.name}'
