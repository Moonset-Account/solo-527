from rest_framework import permissions


class IsAdminOrNurse(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'NURSE']


class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'DOCTOR'


class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PATIENT'


class IsAdminOrNurseOrDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'NURSE', 'DOCTOR']


class IsOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['ADMIN', 'NURSE', 'DOCTOR']:
            return True
        if hasattr(obj, 'patient'):
            return obj.patient.user == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
