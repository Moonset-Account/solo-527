from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission


class Role(models.Model):
    CURATOR = 'curator'
    WAREHOUSE_KEEPER = 'warehouse_keeper'
    CONSTRUCTION_LEAD = 'construction_lead'
    ADMIN = 'admin'

    ROLE_CHOICES = [
        (CURATOR, '策展人'),
        (WAREHOUSE_KEEPER, '仓管'),
        (CONSTRUCTION_LEAD, '施工负责人'),
        (ADMIN, '管理员'),
    ]

    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    groups = models.ManyToManyField(Group, blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)

    class Meta:
        verbose_name = '角色'
        verbose_name_plural = '角色'

    def __str__(self):
        return self.display_name


class User(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.get_role_display()})'

    def get_role_display(self):
        if self.role:
            return self.role.display_name
        return '无角色'

    def is_curator(self):
        return self.role and self.role.name == Role.CURATOR

    def is_warehouse_keeper(self):
        return self.role and self.role.name == Role.WAREHOUSE_KEEPER

    def is_construction_lead(self):
        return self.role and self.role.name == Role.CONSTRUCTION_LEAD

    def is_admin(self):
        return self.is_superuser or (self.role and self.role.name == Role.ADMIN)
