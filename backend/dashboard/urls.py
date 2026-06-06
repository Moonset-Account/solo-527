from django.urls import path
from .views import LibrarianDashboardView

urlpatterns = [
    path('librarian/', LibrarianDashboardView.as_view(), name='librarian-dashboard'),
]
