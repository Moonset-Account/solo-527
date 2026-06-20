from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChangeWindowViewSet, ChangeLogViewSet

router = DefaultRouter()
router.register(r'windows', ChangeWindowViewSet)
router.register(r'logs', ChangeLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
