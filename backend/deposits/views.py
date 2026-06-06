from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DepositAccount, DepositTransaction, TransactionType, TransactionStatus
from .serializers import DepositAccountSerializer, DepositTransactionSerializer

class DepositAccountViewSet(viewsets.ModelViewSet):
    queryset = DepositAccount.objects.all()
    serializer_class = DepositAccountSerializer
    filterset_fields = ['is_abnormal']

    def get_permissions(self):
        if self.action in ['list', 'create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def my_account(self, request):
        if not hasattr(request.user, 'member'):
            return Response({'error': '用户信息不存在'}, status=404)
        account, created = DepositAccount.objects.get_or_create(member=request.user.member)
        return Response(DepositAccountSerializer(account).data)

    @action(detail=True, methods=['post'])
    def add_transaction(self, request, pk=None):
        account = self.get_object()
        amount = request.data.get('amount')
        trans_type = request.data.get('trans_type')
        description = request.data.get('description', '')
        
        if not amount or not trans_type:
            return Response({'error': '金额和类型必填'}, status=400)
        
        transaction = account.add_transaction(
            amount=float(amount),
            trans_type=trans_type,
            description=description
        )
        return Response(DepositTransactionSerializer(transaction).data, status=201)

class DepositTransactionViewSet(viewsets.ModelViewSet):
    queryset = DepositTransaction.objects.all()
    serializer_class = DepositTransactionSerializer
    filterset_fields = ['trans_type', 'status', 'account']

    def get_permissions(self):
        if self.action in ['list', 'create', 'update', 'partial_update', 'destroy', 'confirm', 'reject', 'resolve_appeal']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def my_transactions(self, request):
        if not hasattr(request.user, 'member'):
            return Response({'error': '用户信息不存在'}, status=404)
        account, created = DepositAccount.objects.get_or_create(member=request.user.member)
        transactions = DepositTransaction.objects.filter(account=account).order_by('-create_time')
        return Response(DepositTransactionSerializer(transactions, many=True).data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        transaction = self.get_object()
        transaction.confirm()
        return Response(DepositTransactionSerializer(transaction).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        transaction = self.get_object()
        reject_reason = request.data.get('reject_reason', '')
        transaction.reject(reject_reason)
        return Response(DepositTransactionSerializer(transaction).data)

    @action(detail=True, methods=['post'])
    def appeal(self, request, pk=None):
        transaction = self.get_object()
        if transaction.account.member.user != request.user:
            return Response({'error': '无权限申诉'}, status=403)
        
        appeal_reason = request.data.get('appeal_reason', '')
        result = transaction.account.appeal_transaction(transaction.id, appeal_reason)
        if result:
            return Response({'status': 'success', 'transaction': DepositTransactionSerializer(result).data})
        return Response({'error': '申诉失败，交易状态不允许申诉'}, status=400)

    @action(detail=True, methods=['post'])
    def resolve_appeal(self, request, pk=None):
        transaction = self.get_object()
        approved = request.data.get('approved', False)
        adjust_amount = float(request.data.get('adjust_amount', 0))
        result_note = request.data.get('result_note', '')
        
        success = transaction.resolve_appeal(approved, adjust_amount, result_note)
        if success:
            return Response({'status': 'success', 'transaction': DepositTransactionSerializer(transaction).data})
        return Response({'error': '处理失败，交易状态不正确'}, status=400)
