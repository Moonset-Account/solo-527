from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BorrowRecordViewSet, ReservationViewSet

router = DefaultRouter()
router.register(r'records', BorrowRecordViewSet)
router.register(r'reservations', ReservationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
