from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Deposit, DepositTransaction, DepositAppeal, DepositAppealStatus
from .serializers import (
    DepositSerializer, DepositTransactionSerializer,
    DepositRechargeSerializer, DepositDeductSerializer, DepositConfirmSerializer,
    DepositAppealSerializer, DepositAppealCreateSerializer, DepositAppealHandleSerializer
)
from apps.common.permissions import IsAdminOrLibrarian, IsOwnerOrAdmin


class DepositViewSet(viewsets.ModelViewSet):
    queryset = Deposit.objects.filter(is_deleted=False)
    serializer_class = DepositSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'parent':
            queryset = queryset.filter(family__members=self.request.user)
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_deposit(self, request):
        from apps.accounts.models import Family
        family = Family.objects.filter(members=request.user).first()
        if not family:
            return Response({'error': '用户不属于任何家庭'}, status=status.HTTP_400_BAD_REQUEST)
        
        deposit, created = Deposit.objects.get_or_create(family=family)
        serializer = self.get_serializer(deposit)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_account(self, request):
        from apps.accounts.models import Family
        family = Family.objects.filter(members=request.user).first()
        if not family:
            return Response({'error': '用户不属于任何家庭'}, status=status.HTTP_400_BAD_REQUEST)
        
        deposit, created = Deposit.objects.get_or_create(family=family)
        serializer = self.get_serializer(deposit)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def recharge(self, request, pk=None):
        deposit = self.get_object()
        serializer = DepositRechargeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        amount = serializer.validated_data['amount']
        description = serializer.validated_data.get('description', '后台充值')
        
        try:
            deposit.recharge(amount, description, operator=request.user)
            serializer = self.get_serializer(deposit)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def deduct(self, request, pk=None):
        deposit = self.get_object()
        serializer = DepositDeductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        amount = serializer.validated_data['amount']
        description = serializer.validated_data['description']
        require_confirmation = serializer.validated_data.get('require_confirmation', True)
        
        try:
            transaction = deposit.deduct(
                amount,
                description,
                operator=request.user,
                require_confirmation=require_confirmation
            )
            return Response(DepositTransactionSerializer(transaction).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DepositTransactionViewSet(viewsets.ModelViewSet):
    queryset = DepositTransaction.objects.filter(is_deleted=False)
    serializer_class = DepositTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        deposit_id = self.request.query_params.get('deposit_id')
        transaction_type = self.request.query_params.get('transaction_type')
        needs_confirmation = self.request.query_params.get('needs_confirmation')
        
        if deposit_id:
            queryset = queryset.filter(deposit_id=deposit_id)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if needs_confirmation == 'true':
            queryset = queryset.filter(needs_confirmation=True, confirmed_at__isnull=True)
        
        if self.request.user.role == 'parent':
            queryset = queryset.filter(deposit__family__members=self.request.user)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        transaction = self.get_object()
        try:
            transaction.confirm(operator=request.user)
            serializer = self.get_serializer(transaction)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_transactions(self, request):
        from apps.accounts.models import Family
        family = Family.objects.filter(members=request.user).first()
        if not family:
            return Response([])
        
        queryset = self.get_queryset().filter(deposit__family=family)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        from apps.common.exporters import export_deposit_transactions
        queryset = self.filter_queryset(self.get_queryset())
        return export_deposit_transactions(queryset)


class DepositAppealViewSet(viewsets.ModelViewSet):
    queryset = DepositAppeal.objects.filter(is_deleted=False)
    serializer_class = DepositAppealSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        status = self.request.query_params.get('status')
        family_id = self.request.query_params.get('family_id')
        
        if status:
            queryset = queryset.filter(status=status)
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        
        if self.request.user.role == 'parent':
            queryset = queryset.filter(family__members=self.request.user)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def my_appeals(self, request):
        from apps.accounts.models import Family
        family = Family.objects.filter(members=request.user).first()
        if not family:
            return Response([])
        
        queryset = self.get_queryset().filter(family=family)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        serializer = DepositAppealCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from apps.accounts.models import Family
        family = Family.objects.filter(members=request.user).first()
        if not family:
            return Response({'error': '用户不属于任何家庭'}, status=status.HTTP_400_BAD_REQUEST)
        
        transaction_id = serializer.validated_data['transaction_id']
        try:
            transaction = DepositTransaction.objects.get(id=transaction_id)
        except DepositTransaction.DoesNotExist:
            return Response({'error': '交易记录不存在'}, status=status.HTTP_400_BAD_REQUEST)
        
        if transaction.deposit.family != family:
            return Response({'error': '该交易不属于您的家庭'}, status=status.HTTP_403_FORBIDDEN)
        
        appeal = DepositAppeal.objects.create(
            transaction=transaction,
            family=family,
            appellant=request.user,
            reason=serializer.validated_data['reason'],
            evidence_images=serializer.validated_data.get('evidence_images', [])
        )
        
        transaction.has_appeal = True
        transaction.save()
        
        serializer = self.get_serializer(appeal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        appeal = self.get_object()
        serializer = DepositAppealHandleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        refund_amount = serializer.validated_data.get('refund_amount')
        
        try:
            if action == 'approve':
                appeal.approve(
                    handler=request.user,
                    refund_amount=refund_amount,
                    notes=notes
                )
            else:
                appeal.reject(handler=request.user, notes=notes)
            
            serializer = self.get_serializer(appeal)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
