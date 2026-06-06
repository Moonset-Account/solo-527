from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, FamilyViewSet, ChildViewSet, MemberLevelConfigViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'families', FamilyViewSet)
router.register(r'children', ChildViewSet)
router.register(r'member-levels', MemberLevelConfigViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
