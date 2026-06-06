from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, RegistrationViewSet

router = DefaultRouter()
router.register(r'', ActivityViewSet)
router.register(r'registrations', RegistrationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
