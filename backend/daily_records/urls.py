from django.urls import path
from .views import DailyRecordListView, DailyRecordDetailView, GrowthPhotoListView

urlpatterns = [
    path('', DailyRecordListView.as_view(), name='dailyrecord-list'),
    path('<int:pk>/', DailyRecordDetailView.as_view(), name='dailyrecord-detail'),
    path('photos/', GrowthPhotoListView.as_view(), name='growthphoto-list'),
]
