from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsSecurityOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_security_owner


class IsAdminOrSecurityOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_admin or request.user.is_security_owner
        )


class OrganizationScopedPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.is_admin:
            return True
        if hasattr(obj, 'organization'):
            return obj.organization_id == request.user.organization_id
        return True


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.is_admin:
            return True
        if hasattr(obj, 'created_by'):
            return obj.created_by_id == request.user.id
        return False
