from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Activity, ActivityRegistration, RegistrationStatus, ActivityStatus, ActivityWaitlistNotification
from .serializers import (
    ActivityListSerializer, ActivityDetailSerializer, ActivityRegistrationSerializer,
    ActivityRegistrationCreateSerializer, ActivityWaitlistNotificationSerializer
)
from apps.common.permissions import IsAdminOrLibrarian
from apps.accounts.models import Family, Child
from apps.common.tasks import process_waitlist_promotions


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.filter(is_deleted=False)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ActivityDetailSerializer
        return ActivityListSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        activity_type = self.request.query_params.get('activity_type')
        status = self.request.query_params.get('status')
        theme = self.request.query_params.get('theme')
        upcoming = self.request.query_params.get('upcoming')
        
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        if status:
            queryset = queryset.filter(status=status)
        if theme:
            queryset = queryset.filter(themes__id=theme)
        if upcoming == 'true':
            queryset = queryset.filter(start_time__gte=timezone.now())
        
        return queryset.order_by('start_time')
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        activity = self.get_object()
        activity.status = ActivityStatus.PUBLISHED
        activity.save()
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def open_registration(self, request, pk=None):
        activity = self.get_object()
        activity.status = ActivityStatus.REGISTRATION_OPEN
        activity.save()
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def close_registration(self, request, pk=None):
        activity = self.get_object()
        activity.status = ActivityStatus.REGISTRATION_CLOSED
        activity.save()
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        activity = self.get_object()
        activity.status = ActivityStatus.CANCELLED
        activity.save()
        
        registrations = ActivityRegistration.objects.filter(
            activity=activity,
            status__in=[RegistrationStatus.REGISTERED, RegistrationStatus.CONFIRMED, RegistrationStatus.WAITLISTED, RegistrationStatus.PROMOTED],
            is_deleted=False
        )
        
        for reg in registrations:
            try:
                reg.cancel()
            except Exception:
                pass
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def promote_waitlist(self, request, pk=None):
        count = request.data.get('count', 1)
        process_waitlist_promotions.delay(pk)
        return Response({'message': f'正在处理 {count} 个候补转正'})


class ActivityRegistrationViewSet(viewsets.ModelViewSet):
    queryset = ActivityRegistration.objects.filter(is_deleted=False)
    serializer_class = ActivityRegistrationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'register', 'cancel']:
            return [IsAuthenticated()]
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        activity_id = self.request.query_params.get('activity_id')
        family_id = self.request.query_params.get('family_id')
        child_id = self.request.query_params.get('child_id')
        status = self.request.query_params.get('status')
        waitlist = self.request.query_params.get('waitlist')
        
        if activity_id:
            queryset = queryset.filter(activity_id=activity_id)
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        if child_id:
            queryset = queryset.filter(child_id=child_id)
        if status:
            queryset = queryset.filter(status=status)
        if waitlist == 'true':
            queryset = queryset.filter(status=RegistrationStatus.WAITLISTED)
        
        if self.request.user.role == 'parent':
            queryset = queryset.filter(family__members=self.request.user)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = ActivityRegistrationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        activity = Activity.objects.get(id=serializer.validated_data['activity_id'])
        child = Child.objects.get(id=serializer.validated_data['child_id'])
        family = Family.objects.filter(members=request.user).first()
        
        if not family:
            return Response({'error': '用户不属于任何家庭'}, status=status.HTTP_400_BAD_REQUEST)
        
        if child.family != family:
            return Response({'error': '该儿童不属于您的家庭'}, status=status.HTTP_403_FORBIDDEN)
        
        existing = ActivityRegistration.objects.filter(
            activity=activity,
            child=child,
            status__in=[
                RegistrationStatus.REGISTERED,
                RegistrationStatus.CONFIRMED,
                RegistrationStatus.WAITLISTED,
                RegistrationStatus.PROMOTED
            ],
            is_deleted=False
        ).first()
        
        if existing:
            return Response({'error': '该儿童已报名此活动'}, status=status.HTTP_400_BAD_REQUEST)
        
        registration = ActivityRegistration(
            activity=activity,
            family=family,
            child=child,
            registered_by=request.user
        )
        
        try:
            registration.register()
            serializer = self.get_serializer(registration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        registration = self.get_object()
        
        if request.user.role == 'parent' and registration.registered_by != request.user:
            return Response({'error': '无权限取消此报名'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            registration.cancel()
            serializer = self.get_serializer(registration)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_attended(self, request, pk=None):
        registration = self.get_object()
        try:
            registration.mark_attended()
            serializer = self.get_serializer(registration)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_no_show(self, request, pk=None):
        registration = self.get_object()
        try:
            registration.mark_no_show()
            serializer = self.get_serializer(registration)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        from apps.common.exporters import export_activity_registrations
        queryset = self.filter_queryset(self.get_queryset())
        return export_activity_registrations(queryset)


class ActivityWaitlistNotificationViewSet(viewsets.ModelViewSet):
    queryset = ActivityWaitlistNotification.objects.all()
    serializer_class = ActivityWaitlistNotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'parent':
            queryset = queryset.filter(registration__family__members=self.request.user)
        return queryset.order_by('-sent_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read_at = timezone.now()
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
