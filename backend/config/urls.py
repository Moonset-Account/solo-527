from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import LoginView, UserProfileView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', UserProfileView.as_view(), name='user-profile'),
    path('api/properties/', include('apps.properties.urls')),
    path('api/rooms/', include('apps.properties.room_urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/configuration/', include('apps.configuration.urls')),
    path('api/reminders/', include('apps.reminders.urls')),
    path('api/audit/', include('apps.audit.urls')),
]
