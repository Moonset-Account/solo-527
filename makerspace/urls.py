from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('equipment/', include('equipment.urls')),
    path('training/', include('training.urls')),
    path('bookings/', include('bookings.urls')),
    path('consumables/', include('consumables.urls')),
    path('maintenance/', include('maintenance.urls')),
    path('safety/', include('safety.urls')),
    path('notifications/', include('notifications.urls')),
    path('api/', include('core.api_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
