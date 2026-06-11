from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, ReviewRuleViewSet

router = DefaultRouter()
router.register(r'rules', ReviewRuleViewSet, basename='review-rule')
router.register(r'', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]
