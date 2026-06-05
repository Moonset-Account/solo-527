from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/children/', include('children.urls')),
    path('api/daily-records/', include('daily_records.urls')),
    path('api/pickup/', include('pickup.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/', include('common.urls')),
]
