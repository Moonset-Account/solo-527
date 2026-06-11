from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromptViewSet, PromptCategoryViewSet, PromptTemplateViewSet

router = DefaultRouter()
router.register(r'categories', PromptCategoryViewSet, basename='prompt-category')
router.register(r'templates', PromptTemplateViewSet, basename='prompt-template')
router.register(r'', PromptViewSet, basename='prompt')

urlpatterns = [
    path('', include(router.urls)),
]
