from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .permissions import OrganizationScopedPermission


class OrganizationScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, OrganizationScopedPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_admin:
            qs = qs.filter(organization=self.request.user.organization)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
