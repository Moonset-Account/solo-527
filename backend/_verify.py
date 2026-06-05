import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from accounts.serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer
from accounts.views import CustomObtainAuthToken, UserProfileView, ChangePasswordView, UserListView, UserDetailView
from accounts.urls import urlpatterns
from accounts.admin import CustomUserAdmin

from children.serializers import ClassGroupSerializer, ChildSerializer, ChildListSerializer, ParentChildRelationSerializer, AuthorizedPickupPersonSerializer
from children.views import ClassGroupListView, ClassGroupDetailView, ChildListView, ChildDetailView, ParentChildRelationView, AuthorizedPickupPersonListView, AuthorizedPickupPersonDetailView
from children.urls import urlpatterns as children_urls
from children.admin import ClassGroupAdmin, ChildAdmin, ParentChildRelationAdmin, AuthorizedPickupPersonAdmin

from daily_records.serializers import DailyRecordSerializer, DailyRecordCreateSerializer, GrowthPhotoSerializer
from daily_records.views import DailyRecordListView, DailyRecordDetailView, GrowthPhotoListView
from daily_records.urls import urlpatterns as daily_urls
from daily_records.admin import DailyRecordAdmin, GrowthPhotoAdmin

from pickup.serializers import PickupRecordSerializer, PickupVerifySerializer
from pickup.views import PickupRecordListView, PickupRecordDetailView, PickupVerifyView, TodayPickupStatsView
from pickup.urls import urlpatterns as pickup_urls
from pickup.admin import PickupRecordAdmin

from notifications.serializers import NotificationSerializer, NotificationReadSerializer
from notifications.views import NotificationListView, NotificationDetailView, NotificationMarkReadView, NotificationUnreadCountView
from notifications.urls import urlpatterns as notif_urls
from notifications.admin import NotificationAdmin, NotificationReadAdmin

from finance.serializers import FeeItemSerializer, PaymentSerializer, LeaveRequestSerializer, LeaveRequestCreateSerializer, LeaveReviewSerializer
from finance.views import FeeItemListView, FeeItemDetailView, PaymentListView, PaymentDetailView, PaymentExportView, LeaveRequestListView, LeaveRequestDetailView, LeaveReviewView
from finance.urls import urlpatterns as finance_urls
from finance.admin import FeeItemAdmin, PaymentAdmin, LeaveRequestAdmin

print('所有模块导入验证通过!')
