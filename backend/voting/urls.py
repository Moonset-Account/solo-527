from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoteViewSet, VotingStatisticsViewSet

router = DefaultRouter()
router.register(r'', VoteViewSet, basename='vote')
router.register(r'statistics', VotingStatisticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
