from rest_framework import serializers
from .models import Budget, BudgetItem, BudgetChange, BudgetWarning, BudgetDashboard


class BudgetItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = BudgetItem
        fields = ['id', 'category', 'category_display', 'name', 'specification', 'unit',
                  'quantity', 'unit_price', 'amount', 'remark', 'sort_order']
        read_only_fields = ['id', 'amount']

    def create(self, validated_data):
        quantity = validated_data.get('quantity', 0)
        unit_price = validated_data.get('unit_price', 0)
        validated_data['amount'] = quantity * unit_price
        return super().create(validated_data)

    def update(self, instance, validated_data):
        quantity = validated_data.get('quantity', instance.quantity)
        unit_price = validated_data.get('unit_price', instance.unit_price)
        validated_data['amount'] = quantity * unit_price
        return super().update(instance, validated_data)


class BudgetChangeSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    confirmed_by_name = serializers.CharField(source='confirmed_by.get_full_name', read_only=True)

    class Meta:
        model = BudgetChange
        fields = ['id', 'type', 'type_display', 'name', 'description', 'amount',
                  'status', 'status_display', 'requested_by', 'requested_by_name',
                  'confirmed_by', 'confirmed_by_name', 'confirmed_at',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'confirmed_at']


class BudgetWarningSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    budget_name = serializers.CharField(source='budget.name', read_only=True)
    project_code = serializers.CharField(source='budget.project.code', read_only=True)
    project_name = serializers.CharField(source='budget.project.name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)

    class Meta:
        model = BudgetWarning
        fields = ['id', 'budget', 'budget_name', 'project_code', 'project_name',
                  'level', 'level_display', 'title', 'message', 'current_value',
                  'threshold_value', 'is_read', 'is_resolved', 'resolved_by',
                  'resolved_by_name', 'resolved_at', 'resolved_note', 'created_at']
        read_only_fields = ['id', 'created_at', 'resolved_at']


class BudgetDashboardSerializer(serializers.ModelSerializer):
    project_code = serializers.CharField(source='project.code', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    usage_rate = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = BudgetDashboard
        fields = ['id', 'project', 'project_code', 'project_name', 'budget',
                  'snapshot_date', 'budget_amount', 'actual_amount', 'change_amount',
                  'material_actual', 'labor_actual', 'warning_count', 'usage_rate',
                  'created_at']
        read_only_fields = ['id', 'created_at', 'usage_rate']


class BudgetSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    confirmed_change_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Budget
        fields = ['id', 'project', 'project_code', 'project_name', 'version', 'name',
                  'description', 'total_amount', 'material_cost', 'labor_cost',
                  'equipment_cost', 'other_cost', 'status', 'status_display',
                  'is_current', 'warning_threshold', 'created_by', 'created_by_name',
                  'approved_by', 'approved_by_name', 'approved_at', 'item_count',
                  'confirmed_change_amount', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'approved_at']


class BudgetDetailSerializer(BudgetSerializer):
    items = BudgetItemSerializer(many=True, read_only=True)
    changes = BudgetChangeSerializer(many=True, read_only=True)
    warnings = BudgetWarningSerializer(many=True, read_only=True)

    class Meta(BudgetSerializer.Meta):
        fields = BudgetSerializer.Meta.fields + ['items', 'changes', 'warnings']
