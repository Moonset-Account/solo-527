from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/tickets/', include('apps.tickets.urls')),
    path('api/knowledge/', include('apps.knowledge.urls')),
    path('api/operations/', include('apps.operations.urls')),
    path('api/reports/', include('apps.reports.urls')),
]
