from django.test import TestCase
from django.contrib.auth import get_user_model
from common.tests import TestUserMixin

User = get_user_model()


class ResidentModelTest(TestCase, TestUserMixin):
    def setUp(self):
        self.rep = self.create_representative()
        self.user = self.create_user('resident1', role='resident')

    def test_resident_creation(self):
        from residents.models import Resident
        
        resident = Resident.objects.create(
            user=self.user,
            household_type='ordinary',
            is_voter_qualified=True,
            registered_address='测试地址',
            residence_address='测试居住地址'
        )
        
        self.assertEqual(resident.user, self.user)
        self.assertEqual(resident.household_type, 'ordinary')
        self.assertTrue(resident.is_voter_qualified)

    def test_resident_process_record(self):
        from residents.models import Resident, ResidentProcessRecord
        
        resident = Resident.objects.create(
            user=self.user,
            household_type='ordinary',
            is_voter_qualified=True
        )
        
        record = ResidentProcessRecord.objects.create(
            resident=resident,
            content='已核实居民信息',
            remark='信息准确无误',
            processed_by=self.rep
        )
        
        self.assertEqual(record.resident, resident)
        self.assertEqual(record.content, '已核实居民信息')
        self.assertEqual(record.processed_by, self.rep)
        self.assertIsNotNone(record.processed_at)

    def test_toggle_voting_qualification(self):
        from residents.models import Resident
        from residents.views import ResidentViewSet
        from rest_framework.test import APIRequestFactory
        
        resident = Resident.objects.create(
            user=self.user,
            household_type='ordinary',
            is_voter_qualified=True
        )
        
        factory = APIRequestFactory()
        request = factory.post(
            f'/api/v1/residents/{resident.id}/toggle-voting-qualification/',
            {'reason': '户口迁出'},
            format='json'
        )
        request.user = self.rep
        
        view = ResidentViewSet.as_view({'post': 'toggle_voting_qualification'})
        response = view(request, pk=resident.id)
        
        self.assertEqual(response.status_code, 200)
        
        resident.refresh_from_db()
        self.assertFalse(resident.is_voter_qualified)
        self.assertEqual(resident.qualification_exception_reason, '户口迁出')

    def test_household_member(self):
        from residents.models import Resident, HouseholdMember
        
        resident = Resident.objects.create(
            user=self.user,
            household_type='ordinary',
            is_voter_qualified=True
        )
        
        member = HouseholdMember.objects.create(
            resident=resident,
            name='张三',
            relation='配偶',
            id_card='110101199001011234',
            phone='13800138000',
            is_voter_qualified=True
        )
        
        self.assertEqual(member.resident, resident)
        self.assertEqual(member.relation, '配偶')

    def test_export_api(self):
        from residents.models import Resident
        from residents.views import ResidentViewSet
        from rest_framework.test import APIRequestFactory
        
        Resident.objects.create(
            user=self.user,
            household_type='ordinary',
            is_voter_qualified=True
        )
        
        factory = APIRequestFactory()
        request = factory.get('/api/v1/residents/export/')
        request.user = self.rep
        
        view = ResidentViewSet.as_view({'get': 'export'})
        response = view(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
