from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PickupRecordViewSet, PickupTaskViewSet

router = DefaultRouter()
router.register('records', PickupRecordViewSet)
router.register('tasks', PickupTaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
