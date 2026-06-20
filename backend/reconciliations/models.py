from django.conf import settings
from django.db import models


class Reconciliation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPARED = 'compared', 'Compared'
        CONFIRMED = 'confirmed', 'Confirmed'
        REJECTED = 'rejected', 'Rejected'

    project_name = models.CharField(max_length=255)
    client_name = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reconciliations')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    matched_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    difference_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    file = models.FileField(upload_to='reconciliations/')

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.project_name} - {self.client_name} ({self.get_status_display()})'


class Difference(models.Model):
    class ItemType(models.TextChoices):
        AMOUNT = 'amount', 'Amount'
        DATE = 'date', 'Date'
        MISSING = 'missing', 'Missing'

    reconciliation = models.ForeignKey(Reconciliation, on_delete=models.CASCADE, related_name='differences')
    item_type = models.CharField(max_length=20, choices=ItemType.choices)
    system_value = models.CharField(max_length=255)
    uploaded_value = models.CharField(max_length=255)
    is_confirmed = models.BooleanField(null=True, blank=True)
    confirmed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_differences')
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f'{self.reconciliation.project_name} - {self.get_item_type_display()} diff'
