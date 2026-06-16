from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, UserNotificationViewSet, AnnouncementViewSet

router = DefaultRouter()
router.register(r'list', NotificationViewSet)
router.register(r'my', UserNotificationViewSet, basename='my-notification')
router.register(r'announcements', AnnouncementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
