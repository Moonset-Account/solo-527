from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from .models import InventoryItem, InventoryReservation
from exhibitions.models import BorrowOrder, BorrowItem


class InventoryService:
    @staticmethod
    def check_availability(material, start_date, end_date, exclude_order=None):
        overlapping_reservations = InventoryReservation.objects.filter(
            inventory_item__material=material,
            status__in=[InventoryReservation.PENDING, InventoryReservation.CONFIRMED],
            start_date__lte=end_date,
            end_date__gte=start_date,
        )
        if exclude_order:
            overlapping_reservations = overlapping_reservations.exclude(
                exhibition__borrow_orders=exclude_order
            )

        reserved_item_ids = overlapping_reservations.values_list('inventory_item_id', flat=True)
        available_count = material.inventory_items.filter(
            status=InventoryItem.AVAILABLE
        ).exclude(id__in=reserved_item_ids).count()

        return available_count

    @staticmethod
    @transaction.atomic
    def reserve_inventory(borrow_order, confirmed_by=None):
        reservations = []
        items_to_remove = []
        new_items = []

        for item in borrow_order.items.all():
            available_items = InventoryItem.objects.filter(
                material=item.material,
                status=InventoryItem.AVAILABLE
            )[:item.quantity]

            if len(available_items) < item.quantity:
                raise ValueError(f'物料 {item.material.name} 库存不足')

            if item.quantity == 1:
                inv_item = available_items[0]
                reservation = InventoryReservation.objects.create(
                    inventory_item=inv_item,
                    exhibition=borrow_order.exhibition,
                    borrow_order=borrow_order,
                    requested_by=borrow_order.requester,
                    confirmed_by=confirmed_by,
                    status=InventoryReservation.CONFIRMED if confirmed_by else InventoryReservation.PENDING,
                    start_date=borrow_order.expected_pickup_date,
                    end_date=borrow_order.expected_return_date,
                )
                if confirmed_by:
                    inv_item.status = InventoryItem.RESERVED
                    inv_item.save()
                reservations.append(reservation)
                item.inventory_item = inv_item
                item.save()
            else:
                items_to_remove.append(item)
                for inv_item in available_items:
                    reservation = InventoryReservation.objects.create(
                        inventory_item=inv_item,
                        exhibition=borrow_order.exhibition,
                        borrow_order=borrow_order,
                        requested_by=borrow_order.requester,
                        confirmed_by=confirmed_by,
                        status=InventoryReservation.CONFIRMED if confirmed_by else InventoryReservation.PENDING,
                        start_date=borrow_order.expected_pickup_date,
                        end_date=borrow_order.expected_return_date,
                    )
                    if confirmed_by:
                        inv_item.status = InventoryItem.RESERVED
                        inv_item.save()
                    reservations.append(reservation)

                    new_item = BorrowItem(
                        borrow_order=borrow_order,
                        material=item.material,
                        inventory_item=inv_item,
                        quantity=1,
                        status=BorrowItem.PENDING,
                    )
                    new_items.append(new_item)

        for item in items_to_remove:
            item.delete()

        for new_item in new_items:
            new_item.save()

        return reservations

    @staticmethod
    @transaction.atomic
    def confirm_reservation(borrow_order, confirmed_by):
        reservations = InventoryReservation.objects.filter(
            borrow_order=borrow_order,
            status=InventoryReservation.PENDING,
        )

        for res in reservations:
            res.confirmed_by = confirmed_by
            res.status = InventoryReservation.CONFIRMED
            res.save()
            res.inventory_item.status = InventoryItem.RESERVED
            res.inventory_item.save()

        return reservations

    @staticmethod
    @transaction.atomic
    def release_reservation(reservation):
        inv_item = reservation.inventory_item
        if reservation.status != InventoryReservation.CANCELLED:
            reservation.status = InventoryReservation.CANCELLED
            reservation.save()

            if inv_item.status == InventoryItem.RESERVED:
                inv_item.status = InventoryItem.AVAILABLE
                inv_item.save()

    @staticmethod
    @transaction.atomic
    def pickup_items(borrow_order, picked_by):
        if not borrow_order.can_be_picked_up():
            raise ValueError('借用单无法领取，请检查状态和确认流程')

        borrow_items = borrow_order.items.filter(
            status__in=[BorrowItem.PENDING, BorrowItem.RETURNED]
        )

        for borrow_item in borrow_items:
            if borrow_item.inventory_item:
                borrow_item.inventory_item.status = InventoryItem.BORROWED
                borrow_item.inventory_item.save()

            borrow_item.status = BorrowItem.PICKED_UP
            borrow_item.picked_up_quantity = borrow_item.quantity
            borrow_item.pickup_time = timezone.now()
            borrow_item.save()

        borrow_order.status = BorrowOrder.PICKED_UP
        borrow_order.actual_pickup_date = timezone.now()
        borrow_order.save()

        for reservation in InventoryReservation.objects.filter(
            borrow_order=borrow_order,
            status=InventoryReservation.CONFIRMED
        ):
            reservation.status = InventoryReservation.FULFILLED
            reservation.save()

    @staticmethod
    @transaction.atomic
    def return_items(borrow_order, returned_by, items_data=None):
        if borrow_order.exhibition.is_open():
            if borrow_order.type != BorrowOrder.TEMPORARY:
                for item in borrow_order.items.all():
                    if item.returned_quantity > 0:
                        raise ValueError('展览已开幕，不能修改已归还记录')

        all_returned = True
        if items_data:
            for item_id, qty in items_data.items():
                borrow_item = BorrowItem.objects.get(id=item_id, borrow_order=borrow_order)
                borrow_item.returned_quantity += qty

                if borrow_item.returned_quantity >= borrow_item.quantity:
                    borrow_item.status = BorrowItem.RETURNED
                    borrow_item.return_time = timezone.now()
                    borrow_item.returned_by = returned_by
                else:
                    all_returned = False
                    borrow_item.status = BorrowItem.PICKED_UP

                if borrow_item.inventory_item and borrow_item.returned_quantity >= borrow_item.quantity:
                    borrow_item.inventory_item.status = InventoryItem.AVAILABLE
                    borrow_item.inventory_item.save()

                borrow_item.save()
        else:
            for borrow_item in borrow_order.items.filter(status=BorrowItem.PICKED_UP):
                borrow_item.returned_quantity = borrow_item.quantity
                borrow_item.status = BorrowItem.RETURNED
                borrow_item.return_time = timezone.now()
                borrow_item.returned_by = returned_by

                if borrow_item.inventory_item:
                    borrow_item.inventory_item.status = InventoryItem.AVAILABLE
                    borrow_item.inventory_item.save()

                borrow_item.save()

        if all_returned:
            borrow_order.status = BorrowOrder.RETURNED
            borrow_order.actual_return_date = timezone.now()
        else:
            borrow_order.status = BorrowOrder.PARTIAL_RETURNED

        borrow_order.save()
