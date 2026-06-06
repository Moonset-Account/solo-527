from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from core.models import BaseModel


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('手机号必须填写')
        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'director')
        return self.create_user(phone, password, **extra_fields)


class User(AbstractUser, BaseModel):
    ROLE_CHOICES = (
        ('director', '园长'),
        ('teacher', '老师'),
        ('parent', '家长'),
    )
    username = None
    phone = models.CharField('手机号', max_length=11, unique=True)
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES)
    name = models.CharField('姓名', max_length=50)
    avatar = models.ImageField('头像', upload_to='avatars/', null=True, blank=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['name', 'role']

    objects = UserManager()

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.name}({self.get_role_display()})'

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.is_active = False
        self.save()


class TeacherProfile(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile', verbose_name='用户')
    employee_id = models.CharField('工号', max_length=30, unique=True)
    classes = models.ManyToManyField('children.ChildClass', related_name='teachers', verbose_name='负责班级')
    position = models.CharField('职位', max_length=50, blank=True)

    class Meta:
        verbose_name = '教师档案'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.user.name


class ParentProfile(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile', verbose_name='用户')
    relation = models.CharField('与儿童关系', max_length=20)
    id_card = models.CharField('身份证号', max_length=18, blank=True)
    address = models.CharField('家庭住址', max_length=200, blank=True)

    class Meta:
        verbose_name = '家长档案'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.user.name
