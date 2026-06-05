from rest_framework import permissions


class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_manager


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class MemberPrivacyPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_manager:
            return True
        if view.action in ['list', 'retrieve']:
            return True
        if view.action in ['create', 'update', 'partial_update']:
            return request.user.is_manager
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.is_manager:
            return True
        if view.action == 'retrieve':
            return True
        return False


class IsOwnerOrManager(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_manager:
            return True
        if hasattr(obj, 'member') and hasattr(obj.member, 'user'):
            return obj.member.user == request.user
        return False
