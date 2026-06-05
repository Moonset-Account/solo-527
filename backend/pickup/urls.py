from django.urls import path
from .views import PickupRecordListView, PickupRecordDetailView, PickupVerifyView, TodayPickupStatsView

urlpatterns = [
    path('', PickupRecordListView.as_view(), name='pickup-list'),
    path('<int:pk>/', PickupRecordDetailView.as_view(), name='pickup-detail'),
    path('<int:pk>/verify/', PickupVerifyView.as_view(), name='pickup-verify'),
    path('stats/today/', TodayPickupStatsView.as_view(), name='pickup-stats-today'),
]
