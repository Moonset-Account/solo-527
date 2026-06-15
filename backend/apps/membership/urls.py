from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    BenefitViewSet,
    MembershipPackageViewSet,
    PackageBenefitViewSet,
    MemberMembershipViewSet,
    BenefitUsageRecordViewSet
)

router = DefaultRouter()
router.register(r'benefits', BenefitViewSet)
router.register(r'packages', MembershipPackageViewSet)
router.register(r'package-benefits', PackageBenefitViewSet)
router.register(r'member-memberships', MemberMembershipViewSet)
router.register(r'usage-records', BenefitUsageRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
