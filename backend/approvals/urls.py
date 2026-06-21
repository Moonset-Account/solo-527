from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'levels', views.ApprovalLevelViewSet, basename='approval-level')
router.register(r'flows', views.ApprovalFlowViewSet, basename='approval-flow')
router.register(r'flow-levels', views.FlowLevelRelationViewSet, basename='flow-level-relation')
router.register(r'requests', views.ApprovalRequestViewSet, basename='approval-request')
router.register(r'records', views.ApprovalRecordViewSet, basename='approval-record')

urlpatterns = [
    path('', include(router.urls)),
]
