from django.db import models
from core.models import TimeStampedModel

class Region(TimeStampedModel):
    name = models.CharField(max_length=100, verbose_name='区域名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='区域编码')

    class Meta:
        verbose_name = '区域'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return self.name

class Store(TimeStampedModel):
    name = models.CharField(max_length=100, verbose_name='门店名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='门店编码')
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='所属区域', related_name='stores')
    address = models.CharField(max_length=255, blank=True, verbose_name='门店地址')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')

    class Meta:
        verbose_name = '门店'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'
