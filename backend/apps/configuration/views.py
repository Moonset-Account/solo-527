from datetime import datetime

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.configuration.models import CleaningTask, ItineraryVersion, TourRoute, TourWaypoint
from apps.configuration.serializers import (
    CleaningTaskSerializer,
    ItineraryVersionSerializer,
    TourRouteSerializer,
    TourWaypointSerializer,
    VersionDiffSerializer,
)


class CanManageConfiguration(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['super_admin', 'host']

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'super_admin':
            return True
        if request.user.role == 'host':
            return True
        return request.method in permissions.SAFE_METHODS


class TourRouteViewSet(viewsets.ModelViewSet):
    queryset = TourRoute.objects.all().prefetch_related('waypoints')
    serializer_class = TourRouteSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageConfiguration]
    filterset_fields = ['property', 'is_published']

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        route = self.get_object()
        route.is_published = True
        route.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        route = self.get_object()
        route.is_published = False
        route.save()
        return Response({'status': 'success'})


class TourWaypointViewSet(viewsets.ModelViewSet):
    queryset = TourWaypoint.objects.all()
    serializer_class = TourWaypointSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageConfiguration]
    filterset_fields = ['route']


class CleaningTaskViewSet(viewsets.ModelViewSet):
    queryset = CleaningTask.objects.select_related('room', 'assigned_to', 'created_by')
    serializer_class = CleaningTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['room', 'assigned_to', 'status', 'priority']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), CanManageConfiguration()]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        assigned_to = self.request.query_params.get('assigned_to')
        date = self.request.query_params.get('date')

        if status:
            queryset = queryset.filter(status=status)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        if date:
            queryset = queryset.filter(deadline__date=date)

        return queryset

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        task = self.get_object()
        task.status = 'in_progress'
        task.start_time = datetime.now()
        task.save()
        return Response(CleaningTaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = 'completed'
        task.end_time = datetime.now()
        task.save()
        return Response(CleaningTaskSerializer(task).data)


class ItineraryVersionViewSet(viewsets.ModelViewSet):
    queryset = ItineraryVersion.objects.select_related('created_by', 'published_by')
    serializer_class = ItineraryVersionSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageConfiguration]
    filterset_fields = ['status']

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        itinerary = self.get_object()
        itinerary.status = 'published'
        itinerary.published_at = datetime.now()
        itinerary.published_by = request.user
        itinerary.save()
        return Response(ItineraryVersionSerializer(itinerary).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        itinerary = self.get_object()
        itinerary.status = 'archived'
        itinerary.save()
        return Response(ItineraryVersionSerializer(itinerary).data)

    @action(detail=False, methods=['get'])
    def compare(self, request):
        v1_id = request.query_params.get('version1_id')
        v2_id = request.query_params.get('version2_id')

        if not v1_id or not v2_id:
            return Response(
                {'error': '缺少版本ID参数'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            v1 = ItineraryVersion.objects.get(id=v1_id)
            v2 = ItineraryVersion.objects.get(id=v2_id)
        except ItineraryVersion.DoesNotExist:
            return Response(
                {'error': '版本不存在'},
                status=status.HTTP_404_NOT_FOUND
            )

        diffs = self._compare_versions(v1, v2)
        serializer = VersionDiffSerializer(diffs, many=True)
        return Response({
            'version1': ItineraryVersionSerializer(v1).data,
            'version2': ItineraryVersionSerializer(v2).data,
            'diffs': serializer.data,
        })

    def _compare_versions(self, v1, v2):
        diffs = []
        fields = ['name', 'description', 'version', 'content']

        for field in fields:
            val1 = getattr(v1, field)
            val2 = getattr(v2, field)
            changed = val1 != val2

            if changed:
                diffs.append({
                    'field': field,
                    'old_value': val1,
                    'new_value': val2,
                    'changed': True
                })

        if isinstance(v1.content, dict) and isinstance(v2.content, dict):
            all_keys = set(list(v1.content.keys()) + list(v2.content.keys()))
            for key in sorted(all_keys):
                val1 = v1.content.get(key)
                val2 = v2.content.get(key)
                if val1 != val2:
                    diffs.append({
                        'field': f'content.{key}',
                        'old_value': val1,
                        'new_value': val2,
                        'changed': True
                    })

        return diffs
