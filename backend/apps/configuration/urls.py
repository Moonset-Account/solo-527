from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.configuration.views import (
    CleaningTaskViewSet,
    ItineraryVersionViewSet,
    TourRouteViewSet,
    TourWaypointViewSet,
)

router = DefaultRouter()
router.register(r'routes', TourRouteViewSet, basename='tour-route')
router.register(r'waypoints', TourWaypointViewSet, basename='tour-waypoint')
router.register(r'cleaning', CleaningTaskViewSet, basename='cleaning-task')
router.register(r'itineraries', ItineraryVersionViewSet, basename='itinerary-version')

urlpatterns = [
    path('', include(router.urls)),
]
