from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Activity, Registration, RegistrationStatus, ActivityStatus
from .serializers import ActivitySerializer, RegistrationSerializer

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filterset_fields = ['status', 'activity_type']
    search_fields = ['title', 'location']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        activity = self.get_object()
        if not hasattr(request.user, 'member'):
            return Response({'error': '用户信息不存在'}, status=404)
        
        reg, message = activity.register(request.user.member)
        if reg:
            return Response({
                'status': 'success',
                'message': message,
                'registration': RegistrationSerializer(reg).data
            })
        return Response({'status': 'error', 'message': message}, status=400)

    @action(detail=False, methods=['get'])
    def my_registrations(self, request):
        if not hasattr(request.user, 'member'):
            return Response({'error': '用户信息不存在'}, status=404)
        regs = Registration.objects.filter(member=request.user.member).order_by('-create_time')
        return Response(RegistrationSerializer(regs, many=True).data)

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    filterset_fields = ['status', 'activity', 'member']

    def get_permissions(self):
        if self.action in ['cancel']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        registration = self.get_object()
        if registration.member.user != request.user and not request.user.is_staff:
            return Response({'error': '无权限取消'}, status=403)
        
        success = registration.activity.cancel_registration(registration)
        if success:
            return Response({'status': 'success', 'registration': RegistrationSerializer(registration).data})
        return Response({'error': '取消失败'}, status=400)
