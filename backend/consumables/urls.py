from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.ConsumableCategoryViewSet, basename='category')
router.register(r'specifications', views.ConsumableSpecificationViewSet, basename='specification')
router.register(r'attachments', views.SpecificationAttachmentViewSet, basename='attachment')
router.register(r'monthly-usages', views.MonthlyUsageViewSet, basename='monthly-usage')

urlpatterns = [
    path('', include(router.urls)),
]
