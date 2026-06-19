from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VolunteerViewSet, VolunteerRouteViewSet, VolunteerAssignmentViewSet

router = DefaultRouter()
router.register(r'', VolunteerViewSet, basename='volunteer')
router.register(r'routes', VolunteerRouteViewSet)
router.register(r'assignments', VolunteerAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
