from django.urls import path
from . import views

urlpatterns = [
    path('materials/', views.material_list, name='material_list'),
    path('materials/<int:pk>/', views.material_detail, name='material_detail'),
    path('inventory/', views.inventory_list, name='inventory_list'),
    path('warehouses/', views.warehouse_list, name='warehouse_list'),
    path('reservations/', views.reservation_list, name='reservation_list'),
    path('reservations/<int:pk>/confirm/', views.confirm_reservation, name='confirm_reservation'),
    path('reservations/<int:pk>/cancel/', views.cancel_reservation, name='cancel_reservation'),
]
