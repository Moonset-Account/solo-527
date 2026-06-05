from django.urls import path
from .views import (
    ClassGroupListView, ClassGroupDetailView,
    ChildListView, ChildDetailView,
    ParentChildRelationView,
    AuthorizedPickupPersonListView, AuthorizedPickupPersonDetailView,
)

urlpatterns = [
    path('classes/', ClassGroupListView.as_view(), name='class-list'),
    path('classes/<int:pk>/', ClassGroupDetailView.as_view(), name='class-detail'),
    path('', ChildListView.as_view(), name='child-list'),
    path('<int:pk>/', ChildDetailView.as_view(), name='child-detail'),
    path('relations/', ParentChildRelationView.as_view(), name='parent-child-relation'),
    path('<int:child_pk>/pickups/', AuthorizedPickupPersonListView.as_view(), name='authorized-pickup-list'),
    path('<int:child_pk>/pickups/<int:pk>/', AuthorizedPickupPersonDetailView.as_view(), name='authorized-pickup-detail'),
]
