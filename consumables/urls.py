from django.urls import path
from . import views

app_name = 'consumables'

urlpatterns = [
    path('', views.consumable_list, name='list'),
    path('<uuid:pk>/', views.consumable_detail, name='detail'),
    path('<uuid:pk>/use/', views.use_consumable, name='use'),
    path('<uuid:pk>/restock/', views.restock_consumable, name='restock'),
    path('usages/', views.usage_list, name='usage_list'),
    path('usage/', views.usage_list, name='usage_list_alt'),
    path('usages/<uuid:pk>/mark-billed/', views.mark_usage_billed, name='mark_billed'),
    path('low-stock/', views.low_stock_alert, name='low_stock'),
]
