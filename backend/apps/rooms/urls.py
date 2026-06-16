from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyRoomViewSet, SeatViewSet, SeatReservationViewSet, CheckInRecordViewSet

router = DefaultRouter()
router.register(r'study-rooms', StudyRoomViewSet)
router.register(r'seats', SeatViewSet)
router.register(r'reservations', SeatReservationViewSet)
router.register(r'checkins', CheckInRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
