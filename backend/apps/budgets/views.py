from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from openpyxl import Workbook
from datetime import datetime
from io import BytesIO

from .models import Budget, BudgetItem, BudgetChange, BudgetWarning, BudgetDashboard
from .serializers import (
    BudgetSerializer, BudgetDetailSerializer, BudgetItemSerializer,
    BudgetChangeSerializer, BudgetWarningSerializer, BudgetDashboardSerializer
)
from apps.projects.models import ChangeHistory
from apps.users.models import User


class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'is_current']
    search_fields = ['name', 'version', 'project__name', 'project__code']
    ordering_fields = ['created_at', 'updated_at', 'total_amount']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BudgetDetailSerializer
        return BudgetSerializer

    def get_queryset(self):
        return super().get_queryset().annotate(
            item_count=Count('items'),
            confirmed_change_amount=Sum(
                'changes__amount',
                filter=Q(changes__status='confirmed')
            )
        )

    def perform_create(self, serializer):
        budget = serializer.save(created_by=self.request.user)
        budget.project = budget.project
        budget.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        old_data = {}
        for field in ['total_amount', 'material_cost', 'labor_cost', 'equipment_cost', 'other_cost']:
            old_value = getattr(instance, field)
            new_value = serializer.validated_data.get(field)
            if new_value is not None and str(old_value) != str(new_value):
                old_data[field] = str(old_value)

        instance = serializer.save()

        for field, old_value in old_data.items():
            ChangeHistory.objects.create(
                content_type='budget',
                object_id=instance.id,
                field_name=field,
                old_value=old_value,
                new_value=str(getattr(instance, field)),
                changed_by=self.request.user,
                remark='预算金额变更'
            )

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        budget = self.get_object()
        serializer = BudgetItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(budget=budget)
            self._update_budget_totals(budget)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def batch_add_items(self, request, pk=None):
        budget = self.get_object()
        items_data = request.data.get('items', [])
        items = []
        for item_data in items_data:
            serializer = BudgetItemSerializer(data=item_data)
            if serializer.is_valid():
                item = serializer.save(budget=budget)
                items.append(BudgetItemSerializer(item).data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self._update_budget_totals(budget)
        return Response(items, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def create_new_version(self, request, pk=None):
        old_budget = self.get_object()
        new_version_name = request.data.get('version', f'v{float(old_budget.version[1:]) + 1:.1f}')

        new_budget = Budget.objects.create(
            project=old_budget.project,
            version=new_version_name,
            name=old_budget.name,
            description=request.data.get('description', old_budget.description),
            total_amount=old_budget.total_amount,
            material_cost=old_budget.material_cost,
            labor_cost=old_budget.labor_cost,
            equipment_cost=old_budget.equipment_cost,
            other_cost=old_budget.other_cost,
            warning_threshold=old_budget.warning_threshold,
            created_by=self.request.user,
        )

        for item in old_budget.items.all():
            BudgetItem.objects.create(
                budget=new_budget,
                category=item.category,
                name=item.name,
                specification=item.specification,
                unit=item.unit,
                quantity=item.quantity,
                unit_price=item.unit_price,
                amount=item.amount,
                remark=item.remark,
                sort_order=item.sort_order,
            )

        old_budget.is_current = False
        old_budget.save()

        return Response(BudgetDetailSerializer(new_budget).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        budget = self.get_object()
        if budget.status != 'draft':
            return Response({'error': '只有草稿状态可以提交'}, status=status.HTTP_400_BAD_REQUEST)
        budget.status = 'submitted'
        budget.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        budget = self.get_object()
        if budget.status != 'submitted':
            return Response({'error': '只有已提交状态可以审批'}, status=status.HTTP_400_BAD_REQUEST)
        budget.status = 'approved'
        budget.approved_by = self.request.user
        budget.approved_at = datetime.now()
        budget.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        budget = self.get_object()
        budget.status = 'rejected'
        budget.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['get'])
    def export_excel(self, request, pk=None):
        budget = self.get_object()
        wb = Workbook()
        ws = wb.active
        ws.title = '预算明细'

        ws.append([f'项目: {budget.project.name} ({budget.project.code})'])
        ws.append([f'预算名称: {budget.name}', f'版本: {budget.version}'])
        ws.append([f'预算总额: {budget.total_amount}', f'材料: {budget.material_cost}',
                   f'人工: {budget.labor_cost}', f'设备: {budget.equipment_cost}',
                   f'其他: {budget.other_cost}'])
        ws.append([])
        ws.append(['类别', '项目名称', '规格', '单位', '数量', '单价', '金额', '备注'])

        for item in budget.items.all():
            ws.append([item.get_category_display(), item.name, item.specification,
                       item.unit, item.quantity, item.unit_price, item.amount, item.remark])

        ws_change = wb.create_sheet('变更记录')
        ws_change.append(['类型', '名称', '金额', '状态', '申请人', '确认人', '确认时间'])
        for change in budget.changes.all():
            ws_change.append([change.get_type_display(), change.name, change.amount,
                              change.get_status_display(),
                              change.requested_by.get_full_name() if change.requested_by else '',
                              change.confirmed_by.get_full_name() if change.confirmed_by else '',
                              change.confirmed_at])

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename=budget_{budget.project.code}_{budget.version}.xlsx'
        return response

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        project_id = request.query_params.get('project')
        qs = Budget.objects.filter(is_current=True)
        if project_id:
            qs = qs.filter(project_id=project_id)

        total_budget = sum(b.total_amount for b in qs)
        total_material = sum(b.material_cost for b in qs)
        total_labor = sum(b.labor_cost for b in qs)

        warnings_count = BudgetWarning.objects.filter(is_resolved=False).count()

        projects_data = []
        for budget in qs.select_related('project'):
            confirmed_changes = budget.changes.filter(status='confirmed').aggregate(total=Sum('amount'))['total'] or 0
            projects_data.append({
                'project_id': budget.project.id,
                'project_code': budget.project.code,
                'project_name': budget.project.name,
                'budget_id': budget.id,
                'budget_amount': float(budget.total_amount),
                'material_cost': float(budget.material_cost),
                'labor_cost': float(budget.labor_cost),
                'change_amount': float(confirmed_changes),
                'total_with_changes': float(budget.total_amount + confirmed_changes),
                'warning_count': budget.warnings.filter(is_resolved=False).count(),
            })

        return Response({
            'summary': {
                'total_budget': float(total_budget),
                'total_material': float(total_material),
                'total_labor': float(total_labor),
                'active_warnings': warnings_count,
            },
            'projects': projects_data,
        })

    def _update_budget_totals(self, budget):
        items = budget.items.all()
        budget.material_cost = sum(i.amount for i in items if i.category == 'material')
        budget.labor_cost = sum(i.amount for i in items if i.category == 'labor')
        budget.equipment_cost = sum(i.amount for i in items if i.category == 'equipment')
        budget.other_cost = sum(i.amount for i in items if i.category == 'other')
        budget.calculate_total()
        budget.save()


class BudgetItemViewSet(viewsets.ModelViewSet):
    queryset = BudgetItem.objects.all()
    serializer_class = BudgetItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['budget', 'category']


class BudgetChangeViewSet(viewsets.ModelViewSet):
    queryset = BudgetChange.objects.all()
    serializer_class = BudgetChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['budget', 'type', 'status']
    search_fields = ['name', 'description']

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        change = self.get_object()
        if change.status != 'pending':
            return Response({'error': '只有待确认状态可以确认'}, status=status.HTTP_400_BAD_REQUEST)
        change.status = 'confirmed'
        change.confirmed_by = request.user
        change.confirmed_at = datetime.now()
        change.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        change = self.get_object()
        change.status = 'rejected'
        change.confirmed_by = request.user
        change.confirmed_at = datetime.now()
        change.save()
        return Response({'status': 'success'})


class BudgetWarningViewSet(viewsets.ModelViewSet):
    queryset = BudgetWarning.objects.all()
    serializer_class = BudgetWarningSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['budget', 'level', 'is_read', 'is_resolved']
    http_method_names = ['get', 'post', 'patch']

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        warning = self.get_object()
        warning.is_read = True
        warning.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        warning = self.get_object()
        warning.is_resolved = True
        warning.resolved_by = request.user
        warning.resolved_at = datetime.now()
        warning.resolved_note = request.data.get('note', '')
        warning.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['post'])
    def batch_mark_read(self, request):
        ids = request.data.get('ids', [])
        BudgetWarning.objects.filter(id__in=ids).update(is_read=True)
        return Response({'status': 'success'})


class BudgetDashboardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BudgetDashboard.objects.all()
    serializer_class = BudgetDashboardSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'snapshot_date']
