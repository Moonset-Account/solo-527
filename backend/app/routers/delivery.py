import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.delivery import Delivery
from app.models.elder import Elder
from app.models.subsidy import SubsidyExceedConfirmation
from app.schemas.delivery import (
    DeliveryOut,
    DeliveryCourierView,
    DeliveryFailRequest,
    DeliverySignRequest,
)
from app.services.redispatch import mark_delivery_failed, mark_delivery_signed, redispatch_delivery, get_redispatch_candidates
from app.services.photo_storage import upload_photo
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
    photo: UploadFile = File(default=None),
    db: Session = Depends(get_db),
):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

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
            raise HTTPException(
                status_code=403,
                detail="该长者存在待确认的补贴超额记录，需家属或社工确认后方可签收配送。",
            )

    photo_url = None
    if photo:
        photo_data = photo.file.read()
        photo_url = upload_photo(photo_data, photo.filename or "sign_photo.jpg")

    updated = mark_delivery_signed(db, delivery_id, photo_url=photo_url)
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
