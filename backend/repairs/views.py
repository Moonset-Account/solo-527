from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RepairRecord, RepairStatus
from .serializers import RepairRecordSerializer

class RepairRecordViewSet(viewsets.ModelViewSet):
    queryset = RepairRecord.objects.all()
    serializer_class = RepairRecordSerializer
    filterset_fields = ['status', 'damage_level', 'book']

    def get_permissions(self):
        if self.action in ['list', 'create', 'update', 'partial_update', 'destroy', 'start_repair', 'complete_repair']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, 'member'):
            return Response({'error': '用户信息不存在'}, status=404)
        
        data = request.data.copy()
        data['reporter'] = request.user.member.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def start_repair(self, request, pk=None):
        repair = self.get_object()
        success = repair.start_repair()
        if success:
            return Response(RepairRecordSerializer(repair).data)
        return Response({'error': '当前状态无法开始修复'}, status=400)

    @action(detail=True, methods=['post'])
    def complete_repair(self, request, pk=None):
        repair = self.get_object()
        success = repair.complete_repair()
        if success:
            return Response(RepairRecordSerializer(repair).data)
        return Response({'error': '当前状态无法完成修复'}, status=400)
