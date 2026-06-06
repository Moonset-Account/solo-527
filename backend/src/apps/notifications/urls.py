from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, MessageViewSet

router = DefaultRouter()
router.register('notifications', NotificationViewSet)
router.register('messages', MessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
