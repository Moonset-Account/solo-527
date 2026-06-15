from rest_framework import serializers
from django.utils import timezone
from .models import DashboardWidget, DashboardLayout, LayoutWidget, Alert


class DashboardWidgetSerializer(serializers.ModelSerializer):
    widget_type_display = serializers.CharField(source='get_widget_type_display', read_only=True)
    data_source_display = serializers.CharField(source='get_data_source_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    realtime_data = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'name', 'widget_type', 'widget_type_display',
            'data_source', 'data_source_display', 'title', 'icon',
            'color_scheme', 'size', 'refresh_interval', 'position',
            'is_visible', 'roles', 'created_by', 'created_by_username',
            'realtime_data', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_realtime_data(self, obj):
        from apps.dashboard.views import get_widget_data
        return get_widget_data(obj.data_source)


class LayoutWidgetSerializer(serializers.ModelSerializer):
    widget_id = serializers.IntegerField(source='widget.id', read_only=True)
    widget_name = serializers.CharField(source='widget.name', read_only=True)
    widget_title = serializers.CharField(source='widget.title', read_only=True)
    widget_type = serializers.CharField(source='widget.widget_type', read_only=True)
    widget_data_source = serializers.CharField(source='widget.data_source', read_only=True)
    widget_icon = serializers.CharField(source='widget.icon', read_only=True, allow_null=True)
    widget_color_scheme = serializers.CharField(source='widget.color_scheme', read_only=True)

    class Meta:
        model = LayoutWidget
        fields = [
            'id', 'layout', 'widget', 'widget_id', 'widget_name',
            'widget_title', 'widget_type', 'widget_data_source',
            'widget_icon', 'widget_color_scheme', 'row', 'col',
            'width', 'height', 'created_at'
        ]
        read_only_fields = ['created_at']


class DashboardLayoutSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    layout_widgets = LayoutWidgetSerializer(many=True, read_only=True)
    widget_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    layout_config = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = DashboardLayout
        fields = [
            'id', 'user', 'user_username', 'name', 'is_default',
            'layout_widgets', 'widget_ids', 'layout_config',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        widget_ids = validated_data.pop('widget_ids', [])
        layout_config = validated_data.pop('layout_config', [])
        layout = DashboardLayout.objects.create(**validated_data)

        if layout_config:
            for config in layout_config:
                LayoutWidget.objects.create(
                    layout=layout,
                    widget_id=config['widget_id'],
                    row=config.get('row', 0),
                    col=config.get('col', 0),
                    width=config.get('width', 1),
                    height=config.get('height', 1)
                )
        elif widget_ids:
            for i, widget_id in enumerate(widget_ids):
                LayoutWidget.objects.create(
                    layout=layout,
                    widget_id=widget_id,
                    row=i // 2,
                    col=i % 2,
                    width=1,
                    height=1
                )

        return layout

    def update(self, instance, validated_data):
        widget_ids = validated_data.pop('widget_ids', None)
        layout_config = validated_data.pop('layout_config', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if layout_config is not None:
            instance.layout_widgets.all().delete()
            for config in layout_config:
                LayoutWidget.objects.create(
                    layout=instance,
                    widget_id=config['widget_id'],
                    row=config.get('row', 0),
                    col=config.get('col', 0),
                    width=config.get('width', 1),
                    height=config.get('height', 1)
                )
        elif widget_ids is not None:
            instance.layout_widgets.all().delete()
            for i, widget_id in enumerate(widget_ids):
                LayoutWidget.objects.create(
                    layout=instance,
                    widget_id=widget_id,
                    row=i // 2,
                    col=i % 2,
                    width=1,
                    height=1
                )

        return instance


class AlertSerializer(serializers.ModelSerializer):
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    resolved_by_username = serializers.CharField(source='resolved_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'alert_type', 'alert_type_display', 'source',
            'source_display', 'title', 'message', 'related_id',
            'related_model', 'assigned_to', 'assigned_to_username',
            'is_read', 'read_at', 'is_action_required', 'is_resolved',
            'resolved_at', 'resolved_by', 'resolved_by_username',
            'resolution_notes', 'is_demo', 'created_at'
        ]
        read_only_fields = ['created_at', 'read_at', 'resolved_at']
