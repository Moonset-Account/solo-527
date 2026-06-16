from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContractViewSet, ReviewWorkflowViewSet, ReviewStepViewSet,
    ContractReviewViewSet, StampNodeViewSet, EvidenceChecklistViewSet,
    EvidenceMaterialViewSet, ProgressRecordViewSet, RejectionNotificationViewSet,
    ReviewEfficiencyView, ProgressBoardView,
)

router = DefaultRouter()
router.register(r'contracts', ContractViewSet)
router.register(r'workflows', ReviewWorkflowViewSet)
router.register(r'workflow-steps', ReviewStepViewSet)
router.register(r'reviews', ContractReviewViewSet)
router.register(r'stamp-nodes', StampNodeViewSet)
router.register(r'evidence-checklists', EvidenceChecklistViewSet)
router.register(r'evidence-materials', EvidenceMaterialViewSet)
router.register(r'progress-records', ProgressRecordViewSet)
router.register(r'rejection-notifications', RejectionNotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/efficiency/', ReviewEfficiencyView.as_view(), name='review-efficiency'),
    path('progress-board/', ProgressBoardView.as_view(), name='progress-board'),
]
