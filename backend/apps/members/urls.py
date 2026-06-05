from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemberViewSet, MemberLevelViewSet, ArrivalNotificationViewSet

router = DefaultRouter()
router.register('members', MemberViewSet, basename='member')
router.register('levels', MemberLevelViewSet, basename='member-level')
router.register('notifications', ArrivalNotificationViewSet, basename='arrival-notification')

urlpatterns = [
    path('', include(router.urls)),
]
