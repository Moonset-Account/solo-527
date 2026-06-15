from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    BookingViewSet,
    BookingReminderViewSet,
    TimeSlotViewSet
)

router = DefaultRouter()
router.register(r'bookings', BookingViewSet)
router.register(r'reminders', BookingReminderViewSet)
router.register(r'time-slots', TimeSlotViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
