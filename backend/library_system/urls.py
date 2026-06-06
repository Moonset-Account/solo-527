from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/books/', include('books.urls')),
    path('api/members/', include('members.urls')),
    path('api/borrows/', include('borrows.urls')),
    path('api/activities/', include('activities.urls')),
    path('api/deposits/', include('deposits.urls')),
    path('api/repairs/', include('repairs.urls')),
    path('api/dashboard/', include('dashboard.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
