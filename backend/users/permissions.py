from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import UserRole


class IsProcurementManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.PROCUREMENT_MANAGER


class IsProjectManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.PROJECT_MANAGER


class IsFinance(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.FINANCE


class IsApprover(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.APPROVER


class IsDutyOfficer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.DUTY_OFFICER


class IsProcurementManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in [
            UserRole.PROCUREMENT_MANAGER, UserRole.ADMIN
        ]


class IsFinanceOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in [
            UserRole.FINANCE, UserRole.ADMIN
        ]
