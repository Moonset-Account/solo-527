from django.urls import path
from . import views

app_name = 'ethics'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('projects/', views.project_list, name='project_list'),
    path('projects/create/', views.project_create, name='project_create'),
    path('projects/<int:pk>/', views.project_detail, name='project_detail'),
    path('projects/<int:pk>/edit/', views.project_edit, name='project_edit'),
    path('projects/<int:pk>/submit/', views.project_submit, name='project_submit'),
    path('projects/<int:pk>/pre-review/', views.project_start_pre_review, name='project_start_pre_review'),
    path('projects/<int:pk>/assign/', views.project_assign_review, name='project_assign_review'),
    path('projects/<int:pk>/request-revision/', views.project_request_revision, name='project_request_revision'),
    path('projects/<int:pk>/archive/', views.project_archive, name='project_archive'),
    path('projects/<int:pk>/export/', views.export_project, name='export_project'),

    path('materials/<int:material_pk>/upload/', views.material_version_upload, name='material_version_upload'),

    path('projects/<int:project_pk>/comments/add/', views.review_comment_add, name='review_comment_add'),
    path('projects/<int:project_pk>/resubmit/', views.resubmission_create, name='resubmission_create'),

    path('export/review-list/', views.export_review_list, name='export_review_list'),
    path('export/logs/', views.export_log_list, name='export_log_list'),
]
