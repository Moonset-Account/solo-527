from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TopicViewSet, TopicCommentViewSet

router = DefaultRouter()
router.register(r'', TopicViewSet, basename='topic')
router.register(r'comments', TopicCommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
