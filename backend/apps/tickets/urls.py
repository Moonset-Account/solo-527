from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TicketViewSet, TicketNoteViewSet, TicketHistoryViewSet,
    dashboard_stats
)

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'notes', TicketNoteViewSet, basename='ticketnote')
router.register(r'history', TicketHistoryViewSet, basename='tickethistory')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
]
