from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorProfileViewSet, DoctorScheduleViewSet, DailySlotViewSet

router = DefaultRouter()
router.register(r'profiles', DoctorProfileViewSet, basename='doctor-profile')
router.register(r'schedules', DoctorScheduleViewSet, basename='doctor-schedule')
router.register(r'daily-slots', DailySlotViewSet, basename='daily-slot')

app_name = 'doctors'

urlpatterns = [
    path('', include(router.urls)),
]
