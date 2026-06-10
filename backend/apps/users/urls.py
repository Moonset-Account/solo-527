from django.urls import path

from apps.users.views import UserDetailView, UserListView

urlpatterns = [
    path('', UserListView.as_view(), name='user-list'),
    path('<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
]
