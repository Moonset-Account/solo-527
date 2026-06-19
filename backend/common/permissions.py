from rest_framework import permissions
from django.conf import settings


class IsProductionData(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if settings.IS_PRODUCTION:
            return not obj.is_test_data
        return True


class IsRepresentative(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'representative'


class IsVolunteer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['volunteer', 'representative']
