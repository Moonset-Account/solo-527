from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, SupplierViewSet, CategoryViewSet, BookImageViewSet

router = DefaultRouter()
router.register('books', BookViewSet, basename='book')
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('categories', CategoryViewSet, basename='category')
router.register('images', BookImageViewSet, basename='book-image')

urlpatterns = [
    path('', include(router.urls)),
]
