from django.urls import path
from . import views

app_name = 'equipment'

urlpatterns = [
    path('', views.equipment_list, name='list'),
    path('<uuid:pk>/', views.equipment_detail, name='detail'),
    path('<uuid:pk>/book/', views.equipment_book, name='book'),
    path('<uuid:pk>/usage/start/', views.start_usage, name='start_usage'),
    path('<uuid:pk>/usage/end/<uuid:usage_id>/', views.end_usage, name='end_usage'),
    path('categories/', views.category_list, name='category_list'),
    path('categories/<uuid:pk>/', views.category_detail, name='category_detail'),
]
