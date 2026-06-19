from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from common.models import BaseModel

User = get_user_model()


class TestUserMixin:
    def create_user(self, username='testuser', password='testpass123', role='resident', **kwargs):
        return User.objects.create_user(
            username=username,
            password=password,
            role=role,
            **kwargs
        )

    def create_representative(self, username='rep', password='testpass123'):
        return self.create_user(username=username, password=password, role='representative')

    def create_volunteer(self, username='volunteer', password='testpass123'):
        return self.create_user(username=username, password=password, role='volunteer')

    def create_admin(self, username='admin', password='testpass123'):
        return self.create_user(username=username, password=password, role='admin')


class ProductionDataIsolationTest(TestCase, TestUserMixin):
    def setUp(self):
        self.admin = self.create_admin()
        self.rep = self.create_representative()

    def test_test_data_not_visible_in_production(self):
        from residents.models import Resident
        from django.test import override_settings

        with override_settings(DJANGO_ENV='production'):
            resident = Resident.objects.create(
                user=self.create_user('test1'),
                household_type='ordinary',
                is_test_data=True
            )
            
            queryset = Resident.objects.all()
            self.assertNotIn(resident, queryset)

    def test_test_data_visible_in_development(self):
        from residents.models import Resident
        from django.test import override_settings

        with override_settings(DJANGO_ENV='development'):
            resident = Resident.objects.create(
                user=self.create_user('test2'),
                household_type='ordinary',
                is_test_data=True
            )
            
            queryset = Resident.objects.all()
            self.assertIn(resident, queryset)

    def test_production_data_always_visible(self):
        from residents.models import Resident

        resident = Resident.objects.create(
            user=self.create_user('test3'),
            household_type='ordinary',
            is_test_data=False
        )
        
        queryset = Resident.objects.all()
        self.assertIn(resident, queryset)

    def test_cannot_save_test_data_in_production(self):
        from residents.models import Resident
        from django.test import override_settings
        from django.core.exceptions import ValidationError

        with override_settings(DJANGO_ENV='production'):
            resident = Resident(
                user=self.create_user('test4'),
                household_type='ordinary',
                is_test_data=True
            )
            with self.assertRaises(ValidationError):
                resident.full_clean()
                resident.save()
