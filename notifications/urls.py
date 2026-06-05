from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SMSMessageViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'sms', SMSMessageViewSet, basename='sms-message')
router.register(r'notifications', NotificationViewSet, basename='notification')

app_name = 'notifications'

urlpatterns = [
    path('', include(router.urls)),
]
