from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView
from knox import views as knox_views

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
    path('login/', LoginView.as_view(), name='knox_login'),
    path('logout/', knox_views.LogoutView.as_view(), name='knox_logout'),
    path('logoutall/', knox_views.LogoutAllView.as_view(), name='knox_logoutall'),
]
