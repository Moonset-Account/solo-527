from django.core.management.base import BaseCommand
from django.db import transaction
from apps.dictionaries.models import DictionaryCategory, DictionaryItem


class Command(BaseCommand):
    help = 'Initialize default dictionaries'

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.accounts.models import Organization
        org = Organization.objects.first()
        if not org:
            self.stdout.write(self.style.WARNING('No organization found. Run init_demo_data first.'))
            return

        default_dicts = [
            {
                'code': 'alert_level',
                'name': '告警级别',
                'description': '告警严重程度分级',
                'items': [
                    {'name': '提示', 'value': 'info', 'sort_order': 1},
                    {'name': '告警', 'value': 'warning', 'sort_order': 2},
                    {'name': '严重', 'value': 'critical', 'sort_order': 3},
                    {'name': '紧急', 'value': 'emergency', 'sort_order': 4},
                ]
            },
            {
                'code': 'alert_source',
                'name': '告警来源',
                'description': '告警触发来源',
                'items': [
                    {'name': '自动检测', 'value': 'auto', 'sort_order': 1},
                    {'name': '人工录入', 'value': 'manual', 'sort_order': 2},
                    {'name': '巡检发现', 'value': 'inspection', 'sort_order': 3},
                ]
            },
            {
                'code': 'alert_category',
                'name': '告警分类',
                'description': '告警业务分类',
                'items': [
                    {'name': 'CPU告警', 'value': 'cpu', 'sort_order': 1},
                    {'name': '内存告警', 'value': 'memory', 'sort_order': 2},
                    {'name': '磁盘告警', 'value': 'disk', 'sort_order': 3},
                    {'name': '网络告警', 'value': 'network', 'sort_order': 4},
                    {'name': '服务告警', 'value': 'service', 'sort_order': 5},
                    {'name': '安全告警', 'value': 'security', 'sort_order': 6},
                ]
            },
            {
                'code': 'server_type',
                'name': '服务器类型',
                'description': '服务器资产类型',
                'items': [
                    {'name': '物理机', 'value': 'physical', 'sort_order': 1},
                    {'name': '虚拟机', 'value': 'virtual', 'sort_order': 2},
                    {'name': '容器', 'value': 'container', 'sort_order': 3},
                    {'name': '云主机', 'value': 'cloud', 'sort_order': 4},
                ]
            },
            {
                'code': 'server_status',
                'name': '服务器状态',
                'description': '服务器运行状态',
                'items': [
                    {'name': '正常', 'value': 'normal', 'sort_order': 1},
                    {'name': '告警', 'value': 'warning', 'sort_order': 2},
                    {'name': '严重', 'value': 'critical', 'sort_order': 3},
                    {'name': '离线', 'value': 'offline', 'sort_order': 4},
                    {'name': '维护中', 'value': 'maintenance', 'sort_order': 5},
                ]
            },
            {
                'code': 'change_type',
                'name': '变更类型',
                'description': '变更窗口类型',
                'items': [
                    {'name': '紧急变更', 'value': 'emergency', 'sort_order': 1},
                    {'name': '标准变更', 'value': 'standard', 'sort_order': 2},
                    {'name': '常规变更', 'value': 'normal', 'sort_order': 3},
                ]
            },
            {
                'code': 'change_priority',
                'name': '变更优先级',
                'description': '变更处理优先级',
                'items': [
                    {'name': '低', 'value': 'low', 'sort_order': 1},
                    {'name': '中', 'value': 'medium', 'sort_order': 2},
                    {'name': '高', 'value': 'high', 'sort_order': 3},
                    {'name': '紧急', 'value': 'urgent', 'sort_order': 4},
                ]
            },
            {
                'code': 'inspection_template_type',
                'name': '巡检模板类型',
                'description': '巡检模板分类',
                'items': [
                    {'name': '服务器巡检', 'value': 'server', 'sort_order': 1},
                    {'name': '数据库巡检', 'value': 'database', 'sort_order': 2},
                    {'name': '应用巡检', 'value': 'application', 'sort_order': 3},
                    {'name': '网络巡检', 'value': 'network', 'sort_order': 4},
                    {'name': '安全巡检', 'value': 'security', 'sort_order': 5},
                    {'name': '自定义', 'value': 'custom', 'sort_order': 6},
                ]
            },
            {
                'code': 'notification_event_type',
                'name': '通知事件类型',
                'description': '可触发通知的事件类型',
                'items': [
                    {'name': '告警创建', 'value': 'alert_created', 'sort_order': 1},
                    {'name': '告警升级', 'value': 'alert_level_escalated', 'sort_order': 2},
                    {'name': '告警自动关闭', 'value': 'alert_auto_closed', 'sort_order': 3},
                    {'name': '巡检完成', 'value': 'inspection_completed', 'sort_order': 4},
                    {'name': '巡检失败', 'value': 'inspection_failed', 'sort_order': 5},
                    {'name': '变更开始', 'value': 'change_window_started', 'sort_order': 6},
                    {'name': '变更完成', 'value': 'change_window_completed', 'sort_order': 7},
                    {'name': '变更失败', 'value': 'change_window_failed', 'sort_order': 8},
                    {'name': '变更审批', 'value': 'change_window_approved', 'sort_order': 9},
                ]
            },
        ]

        for dict_data in default_dicts:
            category, created = DictionaryCategory.objects.get_or_create(
                organization=org,
                code=dict_data['code'],
                defaults={
                    'name': dict_data['name'],
                    'description': dict_data['description'],
                    'is_enabled': True,
                }
            )
            if created:
                self.stdout.write(f'Created category: {dict_data["code"]}')
            for item_data in dict_data['items']:
                DictionaryItem.objects.get_or_create(
                    category=category,
                    organization=org,
                    value=item_data['value'],
                    defaults={
                        'name': item_data['name'],
                        'sort_order': item_data['sort_order'],
                        'is_enabled': True,
                    }
                )

        self.stdout.write(self.style.SUCCESS('Default dictionaries initialized'))
