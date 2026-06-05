from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventTypeViewSet, EventRegistrationViewSet, EventTicketViewSet

router = DefaultRouter()
router.register('events', EventViewSet, basename='event')
router.register('types', EventTypeViewSet, basename='event-type')
router.register('registrations', EventRegistrationViewSet, basename='event-registration')
router.register('tickets', EventTicketViewSet, basename='event-ticket')

urlpatterns = [
    path('', include(router.urls)),
]
