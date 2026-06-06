from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, TeacherProfileViewSet, ParentProfileViewSet, LoginView

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('teachers', TeacherProfileViewSet)
router.register('parents', ParentProfileViewSet)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
]
