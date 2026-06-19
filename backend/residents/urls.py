from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResidentViewSet, HouseholdMemberViewSet

router = DefaultRouter()
router.register(r'', ResidentViewSet, basename='resident')
router.register(r'household-members', HouseholdMemberViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
