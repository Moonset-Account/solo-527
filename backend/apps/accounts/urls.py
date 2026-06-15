from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserViewSet, StaffProfileViewSet,
    MemberProfileViewSet, VehicleViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'staff-profiles', StaffProfileViewSet, basename='staffprofile')
router.register(r'member-profiles', MemberProfileViewSet, basename='memberprofile')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')

urlpatterns = [
    path('', include(router.urls)),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
