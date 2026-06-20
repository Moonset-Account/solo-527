from django.db import models
from apps.common import BaseModel


class DictionaryCategory(BaseModel):
    code = models.CharField(max_length=50, verbose_name='分类编码')
    name = models.CharField(max_length=100, verbose_name='分类名称')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    is_enabled = models.BooleanField(default=True, verbose_name='是否启用(别名)')

    class Meta:
        verbose_name = '字典分类'
        verbose_name_plural = verbose_name
        unique_together = [('organization', 'code')]
        ordering = ['code']

    def __str__(self):
        return f'{self.name}({self.code})'

    def save(self, *args, **kwargs):
        if self.is_active != self.is_enabled:
            self.is_enabled = self.is_active
        super().save(*args, **kwargs)


class DictionaryItem(BaseModel):
    category = models.ForeignKey(
        DictionaryCategory,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='所属分类'
    )
    code = models.CharField(max_length=50, verbose_name='字典编码')
    name = models.CharField(max_length=100, verbose_name='字典名称')
    value = models.CharField(max_length=255, blank=True, verbose_name='字典值')
    sort_order = models.IntegerField(default=0, verbose_name='排序')
    is_default = models.BooleanField(default=False, verbose_name='是否默认')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    is_enabled = models.BooleanField(default=True, verbose_name='是否启用(别名)')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='父级'
    )

    class Meta:
        verbose_name = '字典项'
        verbose_name_plural = verbose_name
        unique_together = [('organization', 'category', 'code')]
        ordering = ['category', 'sort_order', 'code']

    def __str__(self):
        return f'{self.category.name} - {self.name}'

    def save(self, *args, **kwargs):
        if self.is_active != self.is_enabled:
            self.is_enabled = self.is_active
        super().save(*args, **kwargs)
