from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'reminders', views.ReminderViewSet, basename='reminder')
router.register(r'reminder-config', views.ReminderConfigViewSet, basename='reminder-config')

urlpatterns = router.urls
