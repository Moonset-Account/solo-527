from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.reminders.views import ReminderRuleViewSet, ReminderViewSet

router = DefaultRouter()
router.register(r'rules', ReminderRuleViewSet, basename='reminder-rule')
router.register(r'', ReminderViewSet, basename='reminder')

urlpatterns = [
    path('', include(router.urls)),
]
