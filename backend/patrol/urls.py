from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatrolRouteViewSet, PatrolTaskViewSet, PatrolCheckInViewSet

router = DefaultRouter()
router.register(r'routes', PatrolRouteViewSet)
router.register(r'tasks', PatrolTaskViewSet)
router.register(r'check-ins', PatrolCheckInViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
