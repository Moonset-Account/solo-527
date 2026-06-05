import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.delivery import Delivery
from app.models.elder import Elder
from app.models.meal import MealOrder
from app.models.notification import Notification
from app.models.subsidy import SubsidyExceedConfirmation, SubsidyRecord
from app.schemas.delivery import (
    DeliveryOut,
    DeliveryCourierView,
    DeliveryFailRequest,
    DeliverySignRequest,
)
from app.services.redispatch import mark_delivery_failed, mark_delivery_signed, redispatch_delivery, get_redispatch_candidates
from app.services.photo_storage import upload_photo
from app.services.subsidy_check import deduct_subsidy
from app.utils.phone_mask import mask_phone

router = APIRouter(prefix="/api/deliveries", tags=["deliveries"])


@router.get("/route/{route_id}", response_model=list[DeliveryOut])
def get_route_deliveries(route_id: uuid.UUID, db: Session = Depends(get_db)):
    deliveries = db.query(Delivery).filter(Delivery.route_id == route_id).all()
    return deliveries


@router.get("/courier/{courier_id}/route/{route_id}", response_model=list[DeliveryCourierView])
def get_courier_route_deliveries(
    courier_id: uuid.UUID, route_id: uuid.UUID, db: Session = Depends(get_db)
):
    deliveries = (
        db.query(Delivery)
        .filter(
            Delivery.route_id == route_id,
            Delivery.courier_id == courier_id,
        )
        .all()
    )

    result = []
    for d in deliveries:
        elder = db.query(Elder).filter(Elder.id == d.elder_id).first()
        result.append(
            DeliveryCourierView(
                id=d.id,
                route_id=d.route_id,
                elder_id=d.elder_id,
                status=d.status,
                exception_note=d.exception_note,
                elder_name=elder.name if elder else None,
                elder_building=elder.building if elder else None,
                elder_room=elder.room if elder else None,
                elder_phone_masked=mask_phone(elder.phone) if elder else None,
            )
        )
    return result


@router.post("/{delivery_id}/sign", response_model=DeliveryOut)
def sign_delivery(
    delivery_id: uuid.UUID,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    if not photo.filename:
        raise HTTPException(status_code=422, detail="签收照片为必填项")

    order_amount = delivery.meal_price
    if not order_amount and delivery.order_id:
        meal_order = db.query(MealOrder).filter(MealOrder.id == delivery.order_id).first()
        if meal_order:
            order_amount = meal_order.total_price

    elder = db.query(Elder).filter(Elder.id == delivery.elder_id).first()
    if elder:
        pending_confirm = (
            db.query(SubsidyExceedConfirmation)
            .filter(
                SubsidyExceedConfirmation.elder_id == elder.id,
                SubsidyExceedConfirmation.status == "pending",
            )
            .first()
        )
        if pending_confirm:
            if pending_confirm.delivery_id is None:
                pending_confirm.delivery_id = delivery_id
                if not pending_confirm.order_amount and order_amount:
                    pending_confirm.order_amount = order_amount
                db.commit()
            raise HTTPException(
                status_code=403,
                detail="该配送单存在待确认的补贴超额记录，需家属或社工确认后方可签收配送。",
            )

        approved_confirm = (
            db.query(SubsidyExceedConfirmation)
            .filter(
                SubsidyExceedConfirmation.elder_id == elder.id,
                SubsidyExceedConfirmation.status == "approved",
            )
            .first()
        )
        if approved_confirm:
            if approved_confirm.delivery_id is None:
                approved_confirm.delivery_id = delivery_id
            if not approved_confirm.order_amount and order_amount:
                approved_confirm.order_amount = order_amount
            db.commit()

            photo_data = photo.file.read()
            photo_url = upload_photo(photo_data, photo.filename)

            updated = mark_delivery_signed(db, delivery_id, photo_url=photo_url)

            confirm_amount = approved_confirm.order_amount or order_amount or 0.0
            if confirm_amount > 0:
                try:
                    deduct_subsidy(
                        db,
                        elder_id=elder.id,
                        order_id=delivery.order_id,
                        amount=confirm_amount,
                        force=True,
                        delivery_id=delivery_id,
                    )
                except (ValueError, PermissionError):
                    pass

            return updated

        if not order_amount:
            today_str = date.today().isoformat()
            meal_order = (
                db.query(MealOrder)
                .filter(
                    MealOrder.elder_id == elder.id,
                    MealOrder.order_date == today_str,
                )
                .first()
            )
            if meal_order:
                order_amount = meal_order.total_price
                if delivery.order_id is None and meal_order:
                    delivery.order_id = meal_order.id
                if delivery.meal_price is None:
                    delivery.meal_price = order_amount
                db.commit()

        current_balance = elder.subsidy_quota - elder.subsidy_used
        if order_amount and order_amount > current_balance:
            confirmation = SubsidyExceedConfirmation(
                elder_id=elder.id,
                delivery_id=delivery_id,
                subsidy_record_id=None,
                order_amount=order_amount,
                confirm_type="family",
                status="pending",
            )
            db.add(confirmation)
            db.flush()
            for contact in elder.family_contacts:
                notification = Notification(
                    notify_type="subsidy_exceed",
                    recipient_type="family",
                    recipient_id=contact.id,
                    recipient_phone=contact.phone,
                    content=(
                        f"尊敬的{contact.name}，{elder.name}的补贴余额为{current_balance:.2f}元，"
                        f"本次用餐{order_amount:.2f}元超出余额，请确认是否继续配送。"
                    ),
                    status="pending",
                    related_id=confirmation.id,
                    related_type="subsidy_exceed_confirmation",
                )
                db.add(notification)
            db.commit()

            raise HTTPException(
                status_code=403,
                detail=f"补贴余额不足（余额{current_balance:.2f}元，订单{order_amount:.2f}元），已生成超额确认记录，需家属或社工确认后方可签收。",
            )

    photo_data = photo.file.read()
    photo_url = upload_photo(photo_data, photo.filename)

    updated = mark_delivery_signed(db, delivery_id, photo_url=photo_url)

    deduct_amount = order_amount or delivery.meal_price or 0.0
    if elder and deduct_amount > 0:
        try:
            deduct_subsidy(
                db,
                elder_id=elder.id,
                order_id=delivery.order_id,
                amount=deduct_amount,
                delivery_id=delivery_id,
            )
        except (ValueError, PermissionError):
            pass

    return updated


@router.post("/{delivery_id}/fail", response_model=DeliveryOut)
def fail_delivery(
    delivery_id: uuid.UUID, data: DeliveryFailRequest, db: Session = Depends(get_db)
):
    try:
        delivery = mark_delivery_failed(db, delivery_id, data.exception_note)
        return delivery
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{delivery_id}/redispatch", response_model=DeliveryOut)
def redispatch(
    delivery_id: uuid.UUID,
    new_route_id: Optional[uuid.UUID] = None,
    new_courier_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
):
    try:
        delivery = redispatch_delivery(db, delivery_id, new_route_id, new_courier_id)
        return delivery
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/route/{route_id}/redispatch-candidates", response_model=list[DeliveryOut])
def list_redispatch_candidates(route_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_redispatch_candidates(db, route_id)


@router.put("/{delivery_id}/exception-note", response_model=DeliveryOut)
def update_exception_note(
    delivery_id: uuid.UUID, data: DeliverySignRequest, db: Session = Depends(get_db)
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    delivery.exception_note = data.exception_note
    db.commit()
    db.refresh(delivery)
    return delivery
