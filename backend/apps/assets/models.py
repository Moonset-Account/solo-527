from django.db import models
from apps.common import BaseModel


class ServerAsset(BaseModel):
    STATUS_NORMAL = 'normal'
    STATUS_WARNING = 'warning'
    STATUS_CRITICAL = 'critical'
    STATUS_OFFLINE = 'offline'
    STATUS_MAINTENANCE = 'maintenance'

    STATUS_CHOICES = [
        (STATUS_NORMAL, '正常'),
        (STATUS_WARNING, '告警'),
        (STATUS_CRITICAL, '严重'),
        (STATUS_OFFLINE, '离线'),
        (STATUS_MAINTENANCE, '维护中'),
    ]

    SERVER_TYPE_PHYSICAL = 'physical'
    SERVER_TYPE_VIRTUAL = 'virtual'
    SERVER_TYPE_CONTAINER = 'container'
    SERVER_TYPE_CLOUD = 'cloud'

    SERVER_TYPE_CHOICES = [
        (SERVER_TYPE_PHYSICAL, '物理机'),
        (SERVER_TYPE_VIRTUAL, '虚拟机'),
        (SERVER_TYPE_CONTAINER, '容器'),
        (SERVER_TYPE_CLOUD, '云主机'),
    ]

    name = models.CharField(max_length=100, verbose_name='服务器名称')
    hostname = models.CharField(max_length=100, blank=True, verbose_name='主机名')
    ip_address = models.GenericIPAddressField(verbose_name='IP地址')
    ip_internal = models.GenericIPAddressField(null=True, blank=True, verbose_name='内网IP')
    server_type = models.CharField(max_length=20, choices=SERVER_TYPE_CHOICES, default=SERVER_TYPE_VIRTUAL, verbose_name='服务器类型')
    os_type = models.CharField(max_length=50, blank=True, verbose_name='操作系统类型')
    os_version = models.CharField(max_length=100, blank=True, verbose_name='操作系统版本')
    cpu_cores = models.IntegerField(default=0, verbose_name='CPU核数')
    memory_gb = models.IntegerField(default=0, verbose_name='内存(GB)')
    disk_gb = models.IntegerField(default=0, verbose_name='磁盘(GB)')
    cpu_usage = models.FloatField(default=0, verbose_name='CPU使用率(%)')
    memory_usage = models.FloatField(default=0, verbose_name='内存使用率(%)')
    disk_usage = models.FloatField(default=0, verbose_name='磁盘使用率(%)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NORMAL, verbose_name='状态')
    location = models.CharField(max_length=200, blank=True, verbose_name='位置/机房')
    idc = models.CharField(max_length=100, blank=True, verbose_name='IDC')
    cabinet = models.CharField(max_length=50, blank=True, verbose_name='机柜')
    responsible = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responsible_servers',
        verbose_name='负责人'
    )
    tags = models.CharField(max_length=500, blank=True, verbose_name='标签')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    last_check_time = models.DateTimeField(null=True, blank=True, verbose_name='最后检测时间')

    class Meta:
        verbose_name = '服务器资产'
        verbose_name_plural = verbose_name
        unique_together = [('organization', 'ip_address')]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name}({self.ip_address})'

    @property
    def tag_list(self):
        return [t.strip() for t in self.tags.split(',') if t.strip()]


class AssetGroup(BaseModel):
    name = models.CharField(max_length=100, verbose_name='分组名称')
    code = models.CharField(max_length=50, blank=True, verbose_name='分组编码')
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='父分组'
    )
    servers = models.ManyToManyField(
        ServerAsset,
        blank=True,
        related_name='groups',
        verbose_name='包含服务器'
    )
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    sort_order = models.IntegerField(default=0, verbose_name='排序')

    class Meta:
        verbose_name = '资产分组'
        verbose_name_plural = verbose_name
        unique_together = [('organization', 'name')]
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name
