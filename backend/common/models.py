from django.db import models
from django.conf import settings
from django.utils import timezone


class BaseModel(models.Model):
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created',
        verbose_name='创建人'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated',
        verbose_name='更新人'
    )
    is_test_data = models.BooleanField(default=False, verbose_name='是否测试数据')

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if settings.IS_PRODUCTION and self.is_test_data:
            raise ValueError("生产环境不允许保存测试数据")
        super().save(*args, **kwargs)


class ProcessRecord(models.Model):
    content = models.TextField(verbose_name='处理内容')
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='处理人'
    )
    processed_at = models.DateTimeField(default=timezone.now, verbose_name='处理时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        abstract = True
        ordering = ['-processed_at']
