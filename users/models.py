from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission


class User(AbstractUser):
    class Role(models.TextChoices):
        RESEARCHER = 'researcher', '研究者'
        SECRETARY = 'secretary', '秘书'
        COMMITTEE = 'committee', '伦理委员'
        ADMIN = 'admin', '管理员'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RESEARCHER,
        verbose_name='角色'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    department = models.CharField(max_length=100, blank=True, verbose_name='所属部门')
    expertise = models.CharField(max_length=200, blank=True, verbose_name='专业领域')

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def is_researcher(self):
        return self.role == self.Role.RESEARCHER

    def is_secretary(self):
        return self.role == self.Role.SECRETARY

    def is_committee(self):
        return self.role == self.Role.COMMITTEE

    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def save(self, *args, **kwargs):
        created = self.pk is None
        super().save(*args, **kwargs)
        if created:
            self._assign_group()

    def _assign_group(self):
        group_name = self._get_group_name()
        if group_name:
            group, _ = Group.objects.get_or_create(name=group_name)
            self.groups.add(group)

    def _get_group_name(self):
        role_map = {
            self.Role.RESEARCHER: '研究者',
            self.Role.SECRETARY: '秘书',
            self.Role.COMMITTEE: '伦理委员',
            self.Role.ADMIN: '管理员',
        }
        return role_map.get(self.role)
