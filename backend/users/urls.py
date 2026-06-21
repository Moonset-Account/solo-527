from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

user_router = SimpleRouter()
user_router.register(r'', views.UserViewSet, basename='user')

filter_router = SimpleRouter()
filter_router.register(r'', views.SavedFilterViewSet, basename='saved-filter')

urlpatterns = [
    path('saved-filters/', include(filter_router.urls)),
    path('', include(user_router.urls)),
]
