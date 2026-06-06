from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DailyRecordViewSet, NapRecordViewSet, MealRecordViewSet,
    ActivityRecordViewSet, GrowthRecordViewSet
)

router = DefaultRouter()
router.register('daily', DailyRecordViewSet)
router.register('nap', NapRecordViewSet)
router.register('meal', MealRecordViewSet)
router.register('activity', ActivityRecordViewSet)
router.register('growth', GrowthRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
