from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepairRecordViewSet

router = DefaultRouter()
router.register(r'', RepairRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
