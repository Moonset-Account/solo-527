from django.urls import path
from .views import (
    FeeItemListView, FeeItemDetailView,
    PaymentListView, PaymentDetailView, PaymentExportView,
    LeaveRequestListView, LeaveRequestDetailView, LeaveReviewView,
)

urlpatterns = [
    path('fee-items/', FeeItemListView.as_view(), name='feeitem-list'),
    path('fee-items/<int:pk>/', FeeItemDetailView.as_view(), name='feeitem-detail'),
    path('payments/', PaymentListView.as_view(), name='payment-list'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('payments/export/', PaymentExportView.as_view(), name='payment-export'),
    path('leaves/', LeaveRequestListView.as_view(), name='leave-list'),
    path('leaves/<int:pk>/', LeaveRequestDetailView.as_view(), name='leave-detail'),
    path('leaves/<int:pk>/review/', LeaveReviewView.as_view(), name='leave-review'),
]
