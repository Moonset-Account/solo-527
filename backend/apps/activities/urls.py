from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, ActivityRegistrationViewSet, ActivityWaitlistNotificationViewSet

router = DefaultRouter()
router.register(r'activities', ActivityViewSet)
router.register(r'registrations', ActivityRegistrationViewSet)
router.register(r'notifications', ActivityWaitlistNotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
