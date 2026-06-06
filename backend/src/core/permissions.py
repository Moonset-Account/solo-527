from rest_framework import permissions


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
