from functools import wraps
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status


class RolePermissionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)


class IsDirector(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'director'


class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['teacher', 'director']


class IsParent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'parent'


class IsTeacherOrDirector(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['teacher', 'director']


def check_class_permission(user, child_class):
    if user.role == 'director':
        return True
    if user.role == 'teacher':
        return hasattr(user, 'teacher_profile') and user.teacher_profile.classes.filter(id=child_class.id).exists()
    return False
