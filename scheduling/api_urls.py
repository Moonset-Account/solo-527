from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    path('calendar-events/', api_views.CalendarEventsView.as_view(), name='api_calendar_events'),
    path('day-summary/<int:year>/<int:month>/<int:day>/', api_views.DaySummaryView.as_view(), name='api_day_summary'),
    path('notifications/unread-count/', api_views.UnreadNotificationCountView.as_view(), name='api_unread_count'),
]
