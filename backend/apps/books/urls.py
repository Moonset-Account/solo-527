from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, BookCopyViewSet, CategoryViewSet, ThemeViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'themes', ThemeViewSet)
router.register(r'books', BookViewSet)
router.register(r'copies', BookCopyViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
