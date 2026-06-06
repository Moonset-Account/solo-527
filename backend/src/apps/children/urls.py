from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChildClassViewSet, ChildViewSet, AuthorizedPickupPersonViewSet,
    ParentChildRelationViewSet
)

router = DefaultRouter()
router.register('classes', ChildClassViewSet)
router.register('children', ChildViewSet)
router.register('authorized-persons', AuthorizedPickupPersonViewSet)
router.register('parent-relations', ParentChildRelationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
