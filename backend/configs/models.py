from django.conf import settings
from django.db import models


class InvoiceConfig(models.Model):
    approval_required = models.BooleanField(default=True)
    auto_apply_threshold = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='updated_invoice_configs')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'InvoiceConfig (approval: {self.approval_required}, threshold: {self.auto_apply_threshold})'


class PrepaidConfig(models.Model):
    balance_threshold = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    warning_enabled = models.BooleanField(default=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='updated_prepaid_configs')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'PrepaidConfig (threshold: {self.balance_threshold}, warning: {self.warning_enabled})'


class CashForecastConfig(models.Model):
    forecast_window_days = models.PositiveIntegerField(default=30)
    confidence_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=0.80)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='updated_cash_forecast_configs')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'CashForecastConfig (window: {self.forecast_window_days}d, confidence: {self.confidence_threshold})'


class ConfigChangelog(models.Model):
    config_type = models.CharField(max_length=50)
    field_name = models.CharField(max_length=100)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='config_changelogs')
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.config_type}.{self.field_name}: {self.old_value} -> {self.new_value}'
