from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.properties.models import Property, Room
from apps.properties.serializers import PropertySerializer, RoomSerializer


class IsHostOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ['super_admin', 'host']:
            return True
        return request.method in permissions.SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'super_admin':
            return True
        if hasattr(obj, 'owner') and obj.owner_id == request.user.id:
            return True
        return request.method in permissions.SAFE_METHODS


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.filter(is_active=True)
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated, IsHostOrAdmin]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return super().get_permissions()


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.filter(is_active=True)
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsHostOrAdmin]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        property_id = self.request.query_params.get('property_id')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        return queryset

    @action(detail=False, methods=['get'])
    def public(self, request):
        rooms = self.get_queryset().select_related('property').prefetch_related('amenities', 'images')
        serializer = self.get_serializer(rooms, many=True)
        return Response(serializer.data)
