from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    BudgetViewSet, BudgetItemViewSet, BudgetChangeViewSet,
    BudgetWarningViewSet, BudgetDashboardViewSet
)

router = DefaultRouter()
router.register(r'', BudgetViewSet, basename='budget')
router.register(r'items', BudgetItemViewSet, basename='budget-item')
router.register(r'changes', BudgetChangeViewSet, basename='budget-change')
router.register(r'warnings', BudgetWarningViewSet, basename='budget-warning')
router.register(r'dashboard', BudgetDashboardViewSet, basename='budget-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
