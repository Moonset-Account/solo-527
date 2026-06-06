import pytest
from datetime import timedelta
from django.utils import timezone
from django.urls import reverse

from users.models import Role
from inventory.models import Material, InventoryItem, Warehouse, InventoryReservation
from exhibitions.models import ExhibitionHall, Exhibition, BorrowOrder, BorrowItem
from exhibitions.services import ApprovalService
from inventory.services import InventoryService


@pytest.mark.django_db
class TestFullWorkflow:
    def test_complete_workflow_without_valuable(self, setup_roles, test_users, setup_inventory):
        curator = test_users[Role.CURATOR]
        warehouse_keeper = test_users[Role.WAREHOUSE_KEEPER]
        construction_lead = test_users[Role.CONSTRUCTION_LEAD]

        hall = ExhibitionHall.objects.create(name='测试展厅', code='TEST001')
        material = setup_inventory['material_normal']

        today = timezone.now().date()
        exhibition = Exhibition.objects.create(
            name='测试展览', code='EX-TEST', hall=hall,
            curator=curator, status=Exhibition.PLANNING,
            start_date=today, end_date=today + timedelta(days=30),
            created_by=curator,
        )

        order = BorrowOrder.objects.create(
            order_no='TEST-WORKFLOW-001',
            exhibition=exhibition,
            hall=hall,
            requester=curator,
            type=BorrowOrder.BORROW,
            status=BorrowOrder.DRAFT,
            is_cross_hall=False,
            expected_pickup_date=today + timedelta(days=1),
            expected_return_date=today + timedelta(days=10),
        )
        BorrowItem.objects.create(
            borrow_order=order, material=material, quantity=2
        )

        assert order.status == BorrowOrder.DRAFT
        assert not order.is_reservation_confirmed()

        ApprovalService.submit_for_approval(order)
        assert order.status == BorrowOrder.APPROVED
        assert not order.is_reservation_confirmed()

        reservations = InventoryReservation.objects.filter(exhibition=exhibition)
        assert reservations.exists()
        assert reservations.count() == 2
        assert reservations.filter(status=InventoryReservation.PENDING).count() == 2

        for res in reservations:
            assert res.inventory_item.status == InventoryItem.AVAILABLE

        InventoryService.confirm_reservation(order, warehouse_keeper)
        assert order.is_reservation_confirmed()
        assert reservations.filter(status=InventoryReservation.CONFIRMED).count() == 2

        for res in reservations:
            res.inventory_item.refresh_from_db()
            assert res.inventory_item.status == InventoryItem.RESERVED

        assert order.can_be_picked_up()
        InventoryService.pickup_items(order, construction_lead)
        assert order.status == BorrowOrder.PICKED_UP

        for res in reservations:
            res.inventory_item.refresh_from_db()
            assert res.inventory_item.status == InventoryItem.BORROWED

        InventoryService.return_items(order, construction_lead)
        assert order.status == BorrowOrder.RETURNED

        for res in reservations:
            res.inventory_item.refresh_from_db()
            assert res.inventory_item.status == InventoryItem.AVAILABLE

    def test_valuable_double_confirm_same_user_forbidden(self, setup_roles, test_users, setup_inventory):
        curator = test_users[Role.CURATOR]
        warehouse_keeper = test_users[Role.WAREHOUSE_KEEPER]
        admin = test_users[Role.ADMIN]

        hall = ExhibitionHall.objects.create(name='测试展厅', code='TEST002')
        material = setup_inventory['material_valuable']

        today = timezone.now().date()
        exhibition = Exhibition.objects.create(
            name='贵重物品测试展览', code='EX-VALUABLE', hall=hall,
            curator=curator, status=Exhibition.PLANNING,
            start_date=today, end_date=today + timedelta(days=30),
            created_by=curator,
        )

        order = BorrowOrder.objects.create(
            order_no='TEST-VALUABLE-001',
            exhibition=exhibition,
            hall=hall,
            requester=curator,
            type=BorrowOrder.BORROW,
            status=BorrowOrder.APPROVED,
            is_cross_hall=False,
            expected_pickup_date=today + timedelta(days=1),
            expected_return_date=today + timedelta(days=10),
        )
        BorrowItem.objects.create(
            borrow_order=order, material=material, quantity=1
        )

        ApprovalService.confirm_valuable_item(order, warehouse_keeper, is_first=True)
        assert order.first_confirmer == warehouse_keeper

        with pytest.raises(ValueError) as exc_info:
            ApprovalService.confirm_valuable_item(order, warehouse_keeper, is_first=False)

        assert '同一账号不能进行两次确认' in str(exc_info.value)

        ApprovalService.confirm_valuable_item(order, admin, is_first=False)
        assert order.second_confirmer == admin
        assert order.is_double_confirmed()

    def test_construction_lead_can_see_approved_orders(self, setup_roles, test_users, client, setup_inventory):
        curator = test_users[Role.CURATOR]
        construction_lead = test_users[Role.CONSTRUCTION_LEAD]

        hall = ExhibitionHall.objects.create(name='测试展厅', code='TEST003')
        material = setup_inventory['material_normal']

        today = timezone.now().date()
        exhibition = Exhibition.objects.create(
            name='测试展览', code='EX-VISIBILITY', hall=hall,
            curator=curator, status=Exhibition.PLANNING,
            start_date=today, end_date=today + timedelta(days=30),
            created_by=curator,
        )

        order = BorrowOrder.objects.create(
            order_no='TEST-VISIBILITY-001',
            exhibition=exhibition,
            hall=hall,
            requester=curator,
            type=BorrowOrder.BORROW,
            status=BorrowOrder.APPROVED,
            expected_pickup_date=today + timedelta(days=1),
            expected_return_date=today + timedelta(days=10),
        )
        BorrowItem.objects.create(
            borrow_order=order, material=material, quantity=2
        )

        client.force_login(construction_lead)
        response = client.get(reverse('borrow_order_list'))
        assert response.status_code == 200
        assert 'TEST-VISIBILITY-001' in str(response.content)

    def test_reservations_isolated_per_order(self, setup_roles, test_users, setup_inventory):
        curator = test_users[Role.CURATOR]
        warehouse_keeper = test_users[Role.WAREHOUSE_KEEPER]

        hall = ExhibitionHall.objects.create(name='测试展厅', code='TEST-ISO')
        material = setup_inventory['material_normal']

        today = timezone.now().date()
        exhibition = Exhibition.objects.create(
            name='测试展览', code='EX-ISO', hall=hall,
            curator=curator, status=Exhibition.PLANNING,
            start_date=today, end_date=today + timedelta(days=30),
            created_by=curator,
        )

        order1 = BorrowOrder.objects.create(
            order_no='TEST-ISO-001',
            exhibition=exhibition,
            hall=hall,
            requester=curator,
            type=BorrowOrder.BORROW,
            status=BorrowOrder.APPROVED,
            expected_pickup_date=today + timedelta(days=1),
            expected_return_date=today + timedelta(days=10),
        )
        BorrowItem.objects.create(
            borrow_order=order1, material=material, quantity=2
        )

        order2 = BorrowOrder.objects.create(
            order_no='TEST-ISO-002',
            exhibition=exhibition,
            hall=hall,
            requester=curator,
            type=BorrowOrder.BORROW,
            status=BorrowOrder.APPROVED,
            expected_pickup_date=today + timedelta(days=1),
            expected_return_date=today + timedelta(days=10),
        )
        BorrowItem.objects.create(
            borrow_order=order2, material=material, quantity=1
        )

        InventoryService.reserve_inventory(order1)
        InventoryService.reserve_inventory(order2)

        assert InventoryReservation.objects.filter(borrow_order=order1).count() == 2
        assert InventoryReservation.objects.filter(borrow_order=order2).count() == 1
        assert InventoryReservation.objects.filter(borrow_order=order1, status=InventoryReservation.PENDING).count() == 2
        assert InventoryReservation.objects.filter(borrow_order=order2, status=InventoryReservation.PENDING).count() == 1

        InventoryService.confirm_reservation(order1, warehouse_keeper)

        assert InventoryReservation.objects.filter(borrow_order=order1, status=InventoryReservation.CONFIRMED).count() == 2
        assert InventoryReservation.objects.filter(borrow_order=order2, status=InventoryReservation.PENDING).count() == 1

        assert order1.is_reservation_confirmed()
        assert not order2.is_reservation_confirmed()
