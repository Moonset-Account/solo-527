from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import RepairRecord, RepairPhoto, RepairStatus
from .serializers import (
    RepairRecordSerializer, RepairTransitionSerializer, RepairRecordCreateSerializer,
    RepairPhotoSerializer
)
from apps.common.permissions import IsAdminOrLibrarian
from apps.books.models import BookCopy
from apps.repairs.models import RepairProgressLog


class RepairRecordViewSet(viewsets.ModelViewSet):
    queryset = RepairRecord.objects.filter(is_deleted=False)
    serializer_class = RepairRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'report']:
            return [IsAuthenticated()]
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        book_copy_id = self.request.query_params.get('book_copy_id')
        book_id = self.request.query_params.get('book_id')
        status = self.request.query_params.get('status')
        damage_type = self.request.query_params.get('damage_type')
        priority = self.request.query_params.get('priority')
        assigned_to = self.request.query_params.get('assigned_to')
        
        if book_copy_id:
            queryset = queryset.filter(book_copy_id=book_copy_id)
        if book_id:
            queryset = queryset.filter(book_copy__book_id=book_id)
        if status:
            queryset = queryset.filter(status=status)
        if damage_type:
            queryset = queryset.filter(damage_type=damage_type)
        if priority:
            queryset = queryset.filter(priority=priority)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def report(self, request):
        serializer = RepairRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        book_copy = BookCopy.objects.get(id=serializer.validated_data['book_copy_id'])
        
        repair_record = RepairRecord.objects.create(
            book_copy=book_copy,
            reported_by=request.user,
            damage_type=serializer.validated_data['damage_type'],
            description=serializer.validated_data['description'],
            priority=serializer.validated_data['priority'],
        )
        
        RepairProgressLog.objects.create(
            repair_record=repair_record,
            status=RepairStatus.REPORTED,
            notes='破损已上报',
            created_by=request.user
        )
        
        photos = request.FILES.getlist('photos')
        for photo in photos:
            RepairPhoto.objects.create(
                repair_record=repair_record,
                photo=photo,
                description='上报照片',
                stage=RepairStatus.REPORTED,
                uploaded_by=request.user
            )
        
        serializer = self.get_serializer(repair_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        repair_record = self.get_object()
        serializer = RepairTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['new_status']
        notes = serializer.validated_data.get('notes', '')
        photo = request.FILES.get('photo')
        photo_description = serializer.validated_data.get('photo_description', '')
        
        try:
            kwargs = {
                'photo': photo,
                'photo_description': photo_description,
                'uploaded_by': request.user
            } if photo else {}
            
            repair_record.transition(new_status, **kwargs)
            
            if notes:
                repair_record.notes = notes
                repair_record.save()
            
            RepairProgressLog.objects.create(
                repair_record=repair_record,
                status=new_status,
                notes=notes,
                created_by=request.user
            )
            
            serializer = self.get_serializer(repair_record)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        repair_record = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if not assigned_to_id:
            return Response({'error': '请指定负责人'}, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.accounts.models import User
        try:
            assigned_to = User.objects.get(id=assigned_to_id)
        except User.DoesNotExist:
            return Response({'error': '用户不存在'}, status=status.HTTP_400_BAD_REQUEST)
        
        repair_record.assigned_to = assigned_to
        repair_record.save()
        
        RepairProgressLog.objects.create(
            repair_record=repair_record,
            status=repair_record.status,
            notes=f'已分配给 {assigned_to.username}',
            created_by=request.user
        )
        
        serializer = self.get_serializer(repair_record)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_photo(self, request, pk=None):
        repair_record = self.get_object()
        photo = request.FILES.get('photo')
        description = request.data.get('description', '')
        stage = request.data.get('stage', repair_record.status)
        
        if not photo:
            return Response({'error': '请上传照片'}, status=status.HTTP_400_BAD_REQUEST)
        
        repair_photo = RepairPhoto.objects.create(
            repair_record=repair_record,
            photo=photo,
            description=description,
            stage=stage,
            uploaded_by=request.user
        )
        
        serializer = RepairPhotoSerializer(repair_photo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        from apps.common.exporters import export_repair_records
        queryset = self.filter_queryset(self.get_queryset())
        return export_repair_records(queryset)


class RepairPhotoViewSet(viewsets.ModelViewSet):
    queryset = RepairPhoto.objects.filter(is_deleted=False)
    serializer_class = RepairPhotoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        repair_record_id = self.request.query_params.get('repair_record_id')
        if repair_record_id:
            queryset = queryset.filter(repair_record_id=repair_record_id)
        return queryset
