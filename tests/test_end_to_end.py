import pytest
from datetime import date, timedelta
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone

from users.models import Role
from inventory.models import Material, MaterialCategory, Warehouse, InventoryItem
from exhibitions.models import ExhibitionHall, Exhibition, BorrowOrder, BorrowItem
from scheduling.models import ScheduleConflict
from inventory.services import InventoryService
from exhibitions.services import ApprovalService
from scheduling.services import ConflictDetectionService, NotificationService

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


@pytest.fixture
def setup_exhibition(db, test_users):
    hall = ExhibitionHall.objects.create(name='一号展厅', code='H001', floor='1F')
    hall2 = ExhibitionHall.objects.create(name='二号展厅', code='H002', floor='2F')

    today = timezone.now().date()
    exhibition = Exhibition.objects.create(
        name='测试展览', code='EX001', hall=hall,
        curator=test_users[Role.CURATOR],
        status=Exhibition.INSTALLATION,
        start_date=today,
        end_date=today + timedelta(days=30),
        created_by=test_users[Role.CURATOR],
    )
    return {
        'exhibition': exhibition,
        'hall': hall,
        'hall2': hall2,
    }


@pytest.mark.django_db
class TestUserRoles:
    def test_user_role_creation(self, test_users):
        assert test_users[Role.CURATOR].is_curator()
        assert test_users[Role.WAREHOUSE_KEEPER].is_warehouse_keeper()
        assert test_users[Role.CONSTRUCTION_LEAD].is_construction_lead()
        assert test_users[Role.ADMIN].is_admin()

    def test_user_permissions(self, test_users, client):
        client.force_login(test_users[Role.CURATOR])
        response = client.get(reverse('calendar'))
        assert response.status_code == 200


@pytest.mark.django_db
class TestInventoryService:
    def test_check_availability(self, setup_inventory):
        material = setup_inventory['material_valuable']
        today = timezone.now().date()
        available = InventoryService.check_availability(
            material, today, today + timedelta(days=7)
        )
        assert available == 5

    def test_reserve_inventory(self, setup_inventory, setup_exhibition, test_users):
        exhibition = setup_exhibition['exhibition']
        material = setup_inventory['material_valuable']

        order = BorrowOrder.objects.create(
            order_no='TEST001',
            exhibition=exhibition,
            hall=setup_exhibition['hall'],
            requester=test_users[Role.CURATOR],
            expected_pickup_date=timezone.now().date(),
            expected_return_date=timezone.now().date() + timedelta(days=7),
        )
        BorrowItem.objects.create(
            borrow_order=order, material=material, quantity=2
        )

        reservations = InventoryService.reserve_inventory(
            order, confirmed_by=test_users[Role.WAREHOUSE_KEEPER]
        )
        assert len(reservations) == 2

        material.refresh_from_db()
        available = InventoryService.check_availability(
            material, timezone.now().date(), timezone.now().date() + timedelta(days=7)
        )
        assert available == 3


@pytest.mark.django_db
class TestApprovalService:
    def test_needs_approval_cross_hall(self, setup_exhibition):
        exhibition = setup_exhibition['exhibition']
        order = BorrowOrder(
            exhibition=exhibition,
            hall=setup_exhibition['hall2'],
            is_cross_hall=True,
        )
        assert ApprovalService.needs_approval(order)

    def test_needs_approval_valuable(self, setup_inventory, setup_exhibition, test_users):
        exhibition = setup_exhibition['exhibition']
        order = BorrowOrder.objects.create(
            order_no='TEST002',
            exhibition=exhibition,
            hall=setup_exhibition['hall'],
            requester=test_users[Role.CURATOR],
            status=BorrowOrder.DRAFT,
            expected_pickup_date=timezone.now().date(),
            expected_return_date=timezone.now().date() + timedelta(days=7),
        )
        BorrowItem.objects.create(
            borrow_order=order,
            material=setup_inventory['material_valuable'],
            quantity=1
        )
        assert ApprovalService.needs_approval(order)

    def test_approve_order(self, setup_exhibition, test_users):
        exhibition = setup_exhibition['exhibition']
        order = BorrowOrder.objects.create(
            order_no='TEST003',
            exhibition=exhibition,
            hall=setup_exhibition['hall'],
            requester=test_users[Role.CURATOR],
            status=BorrowOrder.PENDING_APPROVAL,
            expected_pickup_date=timezone.now().date(),
            expected_return_date=timezone.now().date() + timedelta(days=7),
        )

        ApprovalService.approve_order(order, test_users[Role.ADMIN], '批准')
        assert order.status == BorrowOrder.APPROVED
        assert order.approver == test_users[Role.ADMIN]

    def test_double_confirm_valuable_items(self, setup_inventory, setup_exhibition, test_users):
        exhibition = setup_exhibition['exhibition']
        order = BorrowOrder.objects.create(
            order_no='TEST004',
            exhibition=exhibition,
            hall=setup_exhibition['hall'],
            requester=test_users[Role.CURATOR],
            status=BorrowOrder.APPROVED,
            expected_pickup_date=timezone.now().date(),
            expected_return_date=timezone.now().date() + timedelta(days=7),
        )
        BorrowItem.objects.create(
            borrow_order=order,
            material=setup_inventory['material_valuable'],
            quantity=1
        )

        assert order.has_valuable_items()
        assert not order.is_double_confirmed()

        ApprovalService.confirm_valuable_item(order, test_users[Role.WAREHOUSE_KEEPER], is_first=True)
        assert order.first_confirmer == test_users[Role.WAREHOUSE_KEEPER]
        assert not order.is_double_confirmed()

        ApprovalService.confirm_valuable_item(order, test_users[Role.ADMIN], is_first=False)
        assert order.is_double_confirmed()

    def test_create_temporary_borrow_restriction(self, setup_exhibition, test_users, setup_inventory):
        exhibition = setup_exhibition['exhibition']
        exhibition.status = Exhibition.OPEN
        exhibition.save()

        items_data = [{'material': setup_inventory['material_normal'], 'quantity': 2}]
        order = ApprovalService.create_temporary_borrow(
            exhibition, test_users[Role.CURATOR], items_data
        )
        assert order.type == BorrowOrder.TEMPORARY

        exhibition.status = Exhibition.DRAFT
        exhibition.save()
        with pytest.raises(ValueError):
            ApprovalService.create_temporary_borrow(
                exhibition, test_users[Role.CURATOR], items_data
            )


@pytest.mark.django_db
class TestConflictDetection:
    def test_detect_exhibition_conflicts(self, setup_exhibition, test_users):
        today = timezone.now().date()
        exhibition1 = setup_exhibition['exhibition']

        exhibition2 = Exhibition.objects.create(
            name='冲突展览', code='EX002',
            hall=setup_exhibition['hall'],
            status=Exhibition.PLANNING,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=35),
            created_by=test_users[Role.CURATOR],
        )

        conflicts = ConflictDetectionService.detect_exhibition_conflicts(exhibition2)
        assert len(conflicts) > 0
        assert conflicts[0].type == ScheduleConflict.HALL_CONFLICT


@pytest.mark.django_db
class TestNotificationService:
    def test_create_notification(self, test_users):
        user = test_users[Role.CURATOR]
        notif = NotificationService.create_notification(
            user=user,
            type='info',
            title='测试通知',
            message='这是一条测试消息'
        )
        assert notif.user == user
        assert not notif.is_read

        notif.mark_as_read()
        assert notif.is_read
        assert notif.read_at is not None


@pytest.mark.django_db
class TestViews:
    def test_calendar_view(self, client, test_users):
        client.force_login(test_users[Role.CURATOR])
        response = client.get(reverse('calendar'))
        assert response.status_code == 200
        assert 'calendar' in response.context

    def test_day_detail_view(self, client, test_users):
        client.force_login(test_users[Role.CURATOR])
        today = timezone.now().date()
        response = client.get(reverse(
            'day_detail',
            args=[today.year, today.month, today.day]
        ))
        assert response.status_code == 200

    def test_borrow_order_list_view(self, client, test_users):
        client.force_login(test_users[Role.CURATOR])
        response = client.get(reverse('borrow_order_list'))
        assert response.status_code == 200

    def test_material_list_view(self, client, test_users):
        client.force_login(test_users[Role.CURATOR])
        response = client.get(reverse('material_list'))
        assert response.status_code == 200

    def test_login_required(self, client):
        response = client.get(reverse('calendar'))
        assert response.status_code == 302
        assert '/login/' in response.url


@pytest.mark.django_db
class TestExports:
    def test_export_unreturned_excel(self, client, test_users):
        client.force_login(test_users[Role.ADMIN])
        response = client.get(reverse('export_unreturned'))
        assert response.status_code == 200
        assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in response['Content-Type']

    def test_export_inventory_excel(self, client, test_users):
        client.force_login(test_users[Role.ADMIN])
        response = client.get(reverse('export_inventory'))
        assert response.status_code == 200
        assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in response['Content-Type']
