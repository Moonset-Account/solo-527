from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OverviewAPIView, AccuracyStatsViewSet, DailyStatsViewSet,
    ErrorStatsAPIView, SalesOperationRankingAPIView, PromptVersionRankingAPIView,
    UsageStatsViewSet, TokenUsageViewSet
)

router = DefaultRouter()
router.register(r'accuracy-stats', AccuracyStatsViewSet, basename='accuracy-stats')
router.register(r'daily-stats', DailyStatsViewSet, basename='daily-stats')
router.register(r'usage-stats', UsageStatsViewSet, basename='usage-stats')
router.register(r'token-usage', TokenUsageViewSet, basename='token-usage')

urlpatterns = [
    path('', include(router.urls)),
    path('overview/', OverviewAPIView.as_view(), name='analytics-overview'),
    path('error-stats/', ErrorStatsAPIView.as_view(), name='error-stats'),
    path('sales-operation-ranking/', SalesOperationRankingAPIView.as_view(), name='sales-operation-ranking'),
    path('prompt-version-ranking/', PromptVersionRankingAPIView.as_view(), name='prompt-version-ranking'),
]
