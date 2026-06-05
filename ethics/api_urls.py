from django.urls import path
from rest_framework.routers import DefaultRouter
from .api import ProjectViewSet, MaterialVersionViewSet, ReviewCommentViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'material-versions', MaterialVersionViewSet, basename='materialversion')
router.register(r'review-comments', ReviewCommentViewSet, basename='reviewcomment')

urlpatterns = router.urls
