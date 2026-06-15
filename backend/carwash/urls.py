from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/membership/', include('apps.membership.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/conversion/', include('apps.conversion.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
