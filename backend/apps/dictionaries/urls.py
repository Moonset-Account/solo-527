from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DictionaryCategoryViewSet, DictionaryItemViewSet

router = DefaultRouter()
router.register(r'categories', DictionaryCategoryViewSet)
router.register(r'items', DictionaryItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
