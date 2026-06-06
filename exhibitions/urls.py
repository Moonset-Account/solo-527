from django.urls import path
from . import views

urlpatterns = [
    path('exhibitions/', views.exhibition_list, name='exhibition_list'),
    path('exhibitions/<int:pk>/', views.exhibition_detail, name='exhibition_detail'),
    path('exhibitions/<int:exhibition_pk>/temporary-borrow/', views.create_temporary_borrow, name='create_temporary_borrow'),
    path('borrow-orders/', views.borrow_order_list, name='borrow_order_list'),
    path('borrow-orders/<int:pk>/', views.borrow_order_detail, name='borrow_order_detail'),
    path('borrow-orders/create/<int:exhibition_pk>/', views.borrow_order_create, name='borrow_order_create'),
    path('borrow-orders/<int:pk>/submit/', views.borrow_order_submit, name='borrow_order_submit'),
    path('borrow-orders/<int:pk>/approve/', views.borrow_order_approve, name='borrow_order_approve'),
    path('borrow-orders/<int:pk>/confirm-valuable/', views.confirm_valuable_items, name='confirm_valuable_items'),
    path('borrow-orders/<int:pk>/confirm-reservation/', views.confirm_reservation, name='confirm_reservation'),
    path('borrow-orders/<int:pk>/pickup/', views.pickup_items, name='pickup_items'),
    path('borrow-orders/<int:pk>/return/', views.return_items, name='return_items'),
    path('borrow-orders/<int:pk>/export/', views.export_borrow_order_excel, name='export_borrow_order'),
    path('halls/', views.hall_list, name='hall_list'),
]
