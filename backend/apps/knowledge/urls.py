from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework import mixins
from .views import (
    KnowledgeItemViewSet, KnowledgeQueryViewSet, hot_searches
)


class KnowledgeItemRouterViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    KnowledgeItemViewSet
):
    pass


class KnowledgeQueryRouterViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    KnowledgeQueryViewSet
):
    pass


router = DefaultRouter()
router.register(r'items', KnowledgeItemRouterViewSet, basename='knowledgeitem')
router.register(r'queries', KnowledgeQueryRouterViewSet, basename='knowledgequery')

urlpatterns = [
    path('', include(router.urls)),
    path('hot/', hot_searches, name='hot-searches'),
]
