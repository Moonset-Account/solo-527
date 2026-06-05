from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientProfileViewSet, ChronicDiseaseViewSet

router = DefaultRouter()
router.register(r'profiles', PatientProfileViewSet, basename='patient-profile')
router.register(r'chronic-diseases', ChronicDiseaseViewSet, basename='chronic-disease')

app_name = 'patients'

urlpatterns = [
    path('', include(router.urls)),
]
