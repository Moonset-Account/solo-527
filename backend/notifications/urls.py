from django.urls import path
from .views import (
    NotificationListView, NotificationDetailView,
    NotificationMarkReadView, NotificationUnreadCountView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/', NotificationDetailView.as_view(), name='notification-detail'),
    path('<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
]
