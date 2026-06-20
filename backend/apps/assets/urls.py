from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServerAssetViewSet, AssetGroupViewSet

router = DefaultRouter()
router.register(r'servers', ServerAssetViewSet)
router.register(r'groups', AssetGroupViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
