from rest_framework import status, viewsets
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from .models import InvoiceConfig, PrepaidConfig, CashForecastConfig, ConfigChangelog
from .serializers import (
    InvoiceConfigSerializer,
    PrepaidConfigSerializer,
    CashForecastConfigSerializer,
    ConfigChangelogSerializer,
)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role == 'admin'


class _SingletonConfigMixin:
    def retrieve(self, request, pk=None):
        instance = self.model.objects.first()
        if not instance:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, pk=None):
        instance = self.model.objects.first()
        if not instance:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        old_values = {f.name: getattr(instance, f.name) for f in instance._meta.fields}
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        self._record_changelog(instance, old_values, serializer, request.user)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        instance = self.model.objects.first()
        if not instance:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        old_values = {f.name: getattr(instance, f.name) for f in instance._meta.fields}
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        self._record_changelog(instance, old_values, serializer, request.user)
        return Response(serializer.data)

    def _record_changelog(self, instance, old_values, serializer, user):
        changed_data = getattr(serializer, 'changed_data', None)
        if changed_data is None:
            changed_data = []
            for field_name in serializer.validated_data:
                new_val = str(serializer.validated_data[field_name])
                old_val = str(old_values.get(field_name, ''))
                if new_val != old_val:
                    changed_data.append(field_name)

        for field_name in changed_data:
            if field_name in ('updated_by', 'updated_at'):
                continue
            old_val = str(old_values.get(field_name, ''))
            new_val = str(getattr(instance, field_name, ''))
            ConfigChangelog.objects.create(
                config_type=self.config_type,
                field_name=field_name,
                old_value=old_val,
                new_value=new_val,
                changed_by=user,
            )


class InvoiceConfigView(_SingletonConfigMixin, viewsets.GenericViewSet):
    serializer_class = InvoiceConfigSerializer
    queryset = InvoiceConfig.objects.all()
    model = InvoiceConfig
    config_type = 'invoice'
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class PrepaidConfigView(_SingletonConfigMixin, viewsets.GenericViewSet):
    serializer_class = PrepaidConfigSerializer
    queryset = PrepaidConfig.objects.all()
    model = PrepaidConfig
    config_type = 'prepaid'
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class CashForecastConfigView(_SingletonConfigMixin, viewsets.GenericViewSet):
    serializer_class = CashForecastConfigSerializer
    queryset = CashForecastConfig.objects.all()
    model = CashForecastConfig
    config_type = 'cash_forecast'
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class ConfigChangelogView(viewsets.ReadOnlyModelViewSet):
    serializer_class = ConfigChangelogSerializer
    queryset = ConfigChangelog.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['config_type']
