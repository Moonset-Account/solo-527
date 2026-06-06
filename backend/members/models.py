from django.db import models
from django.contrib.auth.models import User

class MemberRole(models.TextChoices):
    LIBRARIAN = 'librarian', '馆员'
    PARENT = 'parent', '家长'

class Member(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='member')
    role = models.CharField(max_length=20, choices=MemberRole.choices, default=MemberRole.PARENT)
    phone = models.CharField(max_length=20, blank=True)
    family_name = models.CharField(max_length=50)
    child_name = models.CharField(max_length=50, blank=True)
    child_age = models.IntegerField(blank=True, null=True)
    membership_expire = models.DateField(blank=True, null=True)
    create_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'members'

    def __str__(self):
        return f"{self.family_name} - {self.role}"

    def is_librarian(self):
        return self.role == MemberRole.LIBRARIAN

    def is_parent(self):
        return self.role == MemberRole.PARENT
