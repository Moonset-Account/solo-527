from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssistanceDemandViewSet, AssistanceProgressViewSet

router = DefaultRouter()
router.register(r'demands', AssistanceDemandViewSet)
router.register(r'progress', AssistanceProgressViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
