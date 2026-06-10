import json
import difflib

from django.db import models

from apps.users.models import User


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('create', '创建'),
        ('update', '更新'),
        ('delete', '删除'),
    )

    id = models.BigAutoField(primary_key=True)
    action = models.CharField('操作类型', max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField('模型名称', max_length=100)
    object_id = models.BigIntegerField('对象ID', null=True, blank=True)
    object_uuid = models.UUIDField('对象UUID', null=True, blank=True)
    object_name = models.CharField('对象名称', max_length=255, blank=True)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='操作人'
    )
    changed_by_name = models.CharField('操作人姓名', max_length=100, blank=True)
    ip_address = models.GenericIPAddressField('IP地址', null=True, blank=True)
    user_agent = models.TextField('User Agent', blank=True)
    old_values = models.JSONField('变更前数据', default=dict, blank=True)
    new_values = models.JSONField('变更后数据', default=dict, blank=True)
    changed_at = models.DateTimeField('变更时间', auto_now_add=True)

    class Meta:
        db_table = 'audit_log'
        verbose_name = '审计日志'
        verbose_name_plural = '审计日志'
        indexes = [
            models.Index(fields=['model_name', 'object_id'], name='idx_audit_model_object'),
            models.Index(fields=['changed_by', 'changed_at'], name='idx_audit_user_time'),
        ]
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.get_action_display()} - {self.model_name} - {self.changed_by_name}'

    def save(self, *args, **kwargs):
        if self.changed_by and not self.changed_by_name:
            self.changed_by_name = self.changed_by.real_name or self.changed_by.email
        super().save(*args, **kwargs)

    @property
    def action_display(self):
        return dict(self.ACTION_CHOICES).get(self.action, self.action)

    @property
    def diff(self):
        return self.get_field_diffs()

    def get_field_diffs(self):
        diffs = []
        all_fields = set(list(self.old_values.keys()) + list(self.new_values.keys()))

        for field in sorted(all_fields):
            old_val = self.old_values.get(field)
            new_val = self.new_values.get(field)
            changed = old_val != new_val

            if changed:
                diffs.append({
                    'field': field,
                    'old_value': old_val,
                    'new_value': new_val,
                    'changed': True,
                    'diff_html': self._generate_field_diff(old_val, new_val)
                })

        return diffs

    def _generate_field_diff(self, old_val, new_val):
        if isinstance(old_val, (dict, list)):
            old_val = json.dumps(old_val, ensure_ascii=False, indent=2)
        if isinstance(new_val, (dict, list)):
            new_val = json.dumps(new_val, ensure_ascii=False, indent=2)

        old_str = str(old_val) if old_val is not None else ''
        new_str = str(new_val) if new_val is not None else ''

        differ = difflib.HtmlDiff(wrapcolumn=60)
        try:
            diff_html = differ.make_table(
                old_str.splitlines(),
                new_str.splitlines(),
                '变更前',
                '变更后',
                context=True,
                numlines=3
            )
            return diff_html
        except Exception:
            return f'<span class="text-red-600">{old_str}</span> → <span class="text-green-600">{new_str}</span>'

    def get_changed_fields_count(self):
        return len([f for f in self.get_field_diffs() if f['changed']])
