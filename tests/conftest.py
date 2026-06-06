import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'museum_scheduler.settings')
django.setup()

import pytest
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from users.models import Role
from inventory.models import Material, MaterialCategory, Warehouse, InventoryItem
from exhibitions.models import ExhibitionHall, Exhibition

User = get_user_model()


@pytest.fixture
def setup_roles(db):
    roles_data = [
        {'name': Role.CURATOR, 'display_name': '策展人'},
        {'name': Role.WAREHOUSE_KEEPER, 'display_name': '仓管'},
        {'name': Role.CONSTRUCTION_LEAD, 'display_name': '施工负责人'},
        {'name': Role.ADMIN, 'display_name': '管理员'},
    ]
    for data in roles_data:
        Role.objects.get_or_create(**data)
    return Role.objects.all()


@pytest.fixture
def test_users(db, setup_roles):
    users = {}
    for role_name, username, password in [
        (Role.CURATOR, 'curator_test', 'test123'),
        (Role.WAREHOUSE_KEEPER, 'warehouse_test', 'test123'),
        (Role.CONSTRUCTION_LEAD, 'construction_test', 'test123'),
        (Role.ADMIN, 'admin_test', 'test123'),
    ]:
        role = Role.objects.get(name=role_name)
        user = User.objects.create_user(
            username=username,
            password=password,
            email=f'{username}@test.com',
            role=role,
            is_staff=(role_name == Role.ADMIN),
            is_superuser=(role_name == Role.ADMIN),
        )
        users[role_name] = user
    return users


@pytest.fixture
def setup_inventory(db):
    category = MaterialCategory.objects.create(name='展柜类', code='DC')
    material1 = Material.objects.create(
        name='独立展柜', code='DC001', type=Material.DISPLAY_CASE,
        category=category, specification='120*60*100cm',
        is_valuable=True, requires_double_confirm=True
    )
    material2 = Material.objects.create(
        name='轨道射灯', code='LT001', type=Material.LIGHTING,
        category=category, specification='30W'
    )
    warehouse = Warehouse.objects.create(name='主仓库', code='WH001')

    for i in range(5):
        InventoryItem.objects.create(
            material=material1,
            serial_number=f'DC001-{i+1:03d}',
            warehouse=warehouse,
            status=InventoryItem.AVAILABLE
        )
    for i in range(10):
        InventoryItem.objects.create(
            material=material2,
            serial_number=f'LT001-{i+1:03d}',
            warehouse=warehouse,
            status=InventoryItem.AVAILABLE
        )

    return {
        'material_valuable': material1,
        'material_normal': material2,
        'warehouse': warehouse,
    }
