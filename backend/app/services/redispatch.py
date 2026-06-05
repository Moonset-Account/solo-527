import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.delivery import Delivery
from app.models.route import Route, RouteStop
from app.models.notification import Notification
from app.services.notification import create_notification


def mark_delivery_failed(
    db: Session,
    delivery_id: uuid.UUID,
    exception_note: str,
    courier_id: uuid.UUID | None = None,
) -> Delivery:
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise ValueError(f"Delivery {delivery_id} not found")

    delivery.status = "failed"
    delivery.exception_note = exception_note
    delivery.needs_redispatch = True
    delivery.updated_at = datetime.now()

    _create_redispatch_task(db, delivery)

    return delivery


def mark_delivery_signed(
    db: Session,
    delivery_id: uuid.UUID,
    photo_url: str | None = None,
    courier_id: uuid.UUID | None = None,
) -> Delivery:
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise ValueError(f"Delivery {delivery_id} not found")

    delivery.status = "signed"
    delivery.signed_photo_url = photo_url
    delivery.signed_at = datetime.now()
    delivery.updated_at = datetime.now()

    db.commit()
    db.refresh(delivery)
    return delivery


def get_redispatch_candidates(
    db: Session, route_id: uuid.UUID
) -> list[Delivery]:
    return (
        db.query(Delivery)
        .filter(
            Delivery.route_id == route_id,
            Delivery.needs_redispatch == True,
            Delivery.status == "failed",
        )
        .all()
    )


def redispatch_delivery(
    db: Session,
    delivery_id: uuid.UUID,
    new_route_id: uuid.UUID | None = None,
    new_courier_id: uuid.UUID | None = None,
) -> Delivery:
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise ValueError(f"Delivery {delivery_id} not found")

    if new_route_id:
        delivery.route_id = new_route_id

    if new_courier_id:
        delivery.courier_id = new_courier_id

    delivery.status = "pending"
    delivery.needs_redispatch = False
    delivery.updated_at = datetime.now()

    db.commit()
    db.refresh(delivery)
    return delivery


def _create_redispatch_task(db: Session, delivery: Delivery):
    route = db.query(Route).filter(Route.id == delivery.route_id).first()
    if not route:
        return

    create_notification(
        db,
        notify_type="delivery_failed_redispatch",
        recipient_type="station_manager",
        recipient_id=route.id,
        recipient_phone="",
        content=f"配送失败，老人{delivery.elder_id}的餐品需要补派。原因: {delivery.exception_note}",
        related_id=delivery.id,
        related_type="delivery",
    )

    db.commit()
