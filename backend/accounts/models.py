from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        PROJECT_MANAGER = 'project_manager', 'Project Manager'
        FINANCE = 'finance', 'Finance'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.FINANCE)

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'
