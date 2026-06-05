from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FollowUpPlanViewSet, RescheduleReasonViewSet,
    AppointmentViewSet, WaitingQueueViewSet, MedicationReminderViewSet
)

router = DefaultRouter()
router.register(r'followup-plans', FollowUpPlanViewSet, basename='followup-plan')
router.register(r'reschedule-reasons', RescheduleReasonViewSet, basename='reschedule-reason')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'waiting-queue', WaitingQueueViewSet, basename='waiting-queue')
router.register(r'medication-reminders', MedicationReminderViewSet, basename='medication-reminder')

app_name = 'appointments'

urlpatterns = [
    path('', include(router.urls)),
]
