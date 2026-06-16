from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RoleConfigViewSet, RoleConfigHistoryViewSet

router = DefaultRouter()
router.register(r'', UserViewSet)
router.register(r'role-configs', RoleConfigViewSet)
router.register(r'role-history', RoleConfigHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
