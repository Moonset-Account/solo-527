from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models import Event, Seat, TicketTypeConfig, TicketType, Order, OrderItem
from app.enums import EventStatus, SeatStatus, SeatArea
from app.schemas.common import (
    ResponseModel, PageResult, EventOut, SeatOut, TicketTypeConfigOut,
    OrderOut, OrderCreate, PaymentCreate, SeatLockRequest, SeatUnlockRequest,
)
from app.dependencies import get_current_user, get_current_user_optional
from app.utils import paginate, calc_offset, calc_occupancy_rate, now
from app.services.seat_lock import SeatLockService
from app.services.order_service import OrderService
from app.services.registration_service import RegistrationService

router = APIRouter(prefix="/public", tags=["前台"])


@router.get("/events", response_model=ResponseModel[PageResult[EventOut]])
async def list_public_events(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    offset = calc_offset(page, page_size)
    query = select(Event).where(
        and_(
            Event.status.in_([EventStatus.ACTIVE, EventStatus.SOLD_OUT]),
            Event.sales_end_time >= now(),
        )
    )
    count_q = select(func.count(Event.id)).where(
        and_(
            Event.status.in_([EventStatus.ACTIVE, EventStatus.SOLD_OUT]),
            Event.sales_end_time >= now(),
        )
    )
    if keyword:
        like = f"%{keyword}%"
        query = query.where(or_(Event.name.ilike(like), Event.artist.ilike(like), Event.venue.ilike(like)))
        count_q = count_q.where(or_(Event.name.ilike(like), Event.artist.ilike(like), Event.venue.ilike(like)))
    total = (await db.execute(count_q)).scalar() or 0
    query = query.order_by(Event.start_time.asc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    events = list(result.scalars().all())
    items = []
    for e in events:
        eo = EventOut.model_validate(e)
        eo.occupancy_rate = calc_occupancy_rate(e.sold_seats, e.total_seats)
        items.append(eo)
    return ResponseModel(data=PageResult(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.get("/events/{event_id}", response_model=ResponseModel[EventOut])
async def get_public_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="场次不存在")
    if event.status not in [EventStatus.ACTIVE, EventStatus.SOLD_OUT, EventStatus.COMPLETED]:
        raise HTTPException(status_code=404, detail="场次不存在")
    eo = EventOut.model_validate(event)
    eo.occupancy_rate = calc_occupancy_rate(event.sold_seats, event.total_seats)
    return ResponseModel(data=eo)


@router.get("/events/{event_id}/ticket-types", response_model=ResponseModel[list[TicketTypeConfigOut]])
async def get_event_ticket_types(
    event_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TicketTypeConfig).join(
        TicketType, TicketType.id == TicketTypeConfig.ticket_type_id
    ).options(
        joinedload(TicketTypeConfig.ticket_type)
    ).where(and_(
        TicketTypeConfig.event_id == event_id,
        TicketTypeConfig.is_active == True,
    )).order_by(TicketTypeConfig.sort_order))
    configs = list(result.scalars().unique().all())
    items = []
    for cfg in configs:
        tto = TicketTypeConfigOut.model_validate(cfg)
        tto.available_count = cfg.total_inventory - cfg.sold_count - cfg.reserved_count
        if cfg.ticket_type:
            tto.ticket_type_name = cfg.ticket_type.name
            tto.ticket_type_color = cfg.ticket_type.color
            tto.ticket_type_code = cfg.ticket_type.code
        items.append(tto)
    return ResponseModel(data=items)


@router.get("/events/{event_id}/seats", response_model=ResponseModel[list[SeatOut]])
async def get_event_seats(
    event_id: int,
    area: Optional[SeatArea] = None,
    status: Optional[SeatStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Seat).where(Seat.event_id == event_id).options(
        joinedload(Seat.ticket_type),
        joinedload(Seat.ticket_type_config),
    )
    if area:
        query = query.where(Seat.area == area)
    if status:
        query = query.where(Seat.status == status)
    query = query.order_by(Seat.area, Seat.row, Seat.col)
    result = await db.execute(query)
    seats = list(result.scalars().unique().all())
    items = [SeatOut.model_validate(s) for s in seats]
    return ResponseModel(data=items)


@router.get("/events/{event_id}/seats/matrix")
async def get_event_seats_matrix(
    event_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="场次不存在")
    seats_result = await db.execute(
        select(Seat).where(Seat.event_id == event_id).order_by(Seat.area, Seat.row, Seat.col)
    )
    seats = list(seats_result.scalars().all())
    by_area = {}
    area_prices = {}
    for seat in seats:
        if seat.area.value not in by_area:
            by_area[seat.area.value] = {"rows": {}, "seats": []}
        if seat.area.value not in area_prices:
            area_prices[seat.area.value] = {"min": float("inf"), "max": 0}
        price = float(seat.current_price)
        area_prices[seat.area.value]["min"] = min(area_prices[seat.area.value]["min"], price)
        area_prices[seat.area.value]["max"] = max(area_prices[seat.area.value]["max"], price)
        area_data = by_area[seat.area.value]
        row_key = seat.row
        if row_key not in area_data["rows"]:
            area_data["rows"][row_key] = {}
        area_data["rows"][row_key][seat.col] = {
            "id": seat.id,
            "code": seat.seat_code,
            "status": seat.status.value,
            "price": float(seat.current_price),
        }
        area_data["seats"].append({
            "id": seat.id,
            "code": seat.seat_code,
            "row": seat.row,
            "col": seat.col,
            "status": seat.status.value,
            "price": float(seat.current_price),
            "area": seat.area.value,
        })
    area_display = {
        SeatArea.VIP.value: "VIP区",
        SeatArea.FRONT.value: "前区",
        SeatArea.MIDDLE.value: "中区",
        SeatArea.BACK.value: "后区",
        SeatArea.STANDING.value: "站区",
    }
    areas = []
    for area_key, area_data in by_area.items():
        rows = sorted(area_data["rows"].keys())
        max_col = 0
        for r in area_data["rows"].values():
            if r:
                max_col = max(max_col, max(r.keys()))
        matrix = []
        for row_key in rows:
            row_data = area_data["rows"][row_key]
            row_list = []
            for col in range(1, max_col + 1):
                row_list.append(row_data.get(col))
            matrix.append({"row": row_key, "seats": row_list})
        ap = area_prices[area_key]
        areas.append({
            "key": area_key,
            "name": area_display.get(area_key, area_key),
            "price_min": 0 if ap["min"] == float("inf") else ap["min"],
            "price_max": ap["max"],
            "total": len(area_data["seats"]),
            "matrix": matrix,
            "seats": area_data["seats"],
        })
    areas.sort(key=lambda a: list(SeatArea.__members__.values()).index(
        next((sa for sa in SeatArea if sa.value == a["key"]), SeatArea.BACK)
    ))
    stats = {
        "total": len(seats),
        "available": sum(1 for s in seats if s.status == SeatStatus.AVAILABLE),
        "locked": sum(1 for s in seats if s.status == SeatStatus.LOCKED),
        "sold": sum(1 for s in seats if s.status in (SeatStatus.SOLD, SeatStatus.REFUNDED)),
        "reserved": sum(1 for s in seats if s.status == SeatStatus.RESERVED),
        "blocked": sum(1 for s in seats if s.status == SeatStatus.BLOCKED),
    }
    stats["occupancy_rate"] = calc_occupancy_rate(stats["sold"], stats["total"])
    return ResponseModel(data={"event": EventOut.model_validate(event), "areas": areas, "stats": stats})


@router.post("/seats/lock", response_model=ResponseModel)
async def lock_seats(
    request: Request,
    data: SeatLockRequest,
    user=Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    user_id = str(user.id) if user else f"guest:{client_ip}"
    session_id = data.session_id or request.headers.get("X-Session-Id")
    service = SeatLockService(db=db)
    lock_key, seats = await service.lock_seats(data.event_id, data.seat_ids, user_id, session_id)
    total_price = sum(float(s.current_price) for s in seats)
    seat_info = [{"id": s.id, "code": s.seat_code, "area": s.area.value,
                   "row": s.row, "col": s.col, "price": float(s.current_price)} for s in seats]
    return ResponseModel(data={
        "lock_key": lock_key,
        "seats": seat_info,
        "total_price": total_price,
        "timeout_seconds": settings.SEAT_LOCK_TIMEOUT,
        "expires_at": (now() + timedelta(seconds=settings.SEAT_LOCK_TIMEOUT)).isoformat(),
    })


from app.config import settings
from datetime import timedelta


@router.post("/seats/unlock", response_model=ResponseModel)
async def unlock_seats(
    data: SeatUnlockRequest,
    db: AsyncSession = Depends(get_db),
):
    service = SeatLockService(db=db)
    result = await self_unlock_helper(service, data.lock_key, db)
    return ResponseModel(data={"released": result})


async def self_unlock_helper(service: SeatLockService, lock_key: str, db: AsyncSession):
    from app.models import Seat
    result = await db.execute(select(Seat.id).where(Seat.lock_key == lock_key))
    seat_ids = [r[0] for r in result.all()]
    if not seat_ids:
        return 0
    return await service.unlock_seats(seat_ids, lock_key)


@router.post("/orders", response_model=ResponseModel[OrderOut])
async def create_order(
    data: OrderCreate,
    lock_key: str = Query(...),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = await OrderService.create_order(db, user.id, data, lock_key)
    return await get_order_detail_response(order.id, db)


@router.post("/orders/pay", response_model=ResponseModel[OrderOut])
async def pay_order(
    data: PaymentCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = await OrderService.process_payment(db, data, user.id)
    return await get_order_detail_response(order.id, db)


@router.post("/orders/{order_id}/cancel", response_model=ResponseModel[OrderOut])
async def cancel_order(
    order_id: int,
    reason: Optional[str] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = await OrderService.cancel_order(db, order_id, reason, user.id)
    return await get_order_detail_response(order.id, db)


@router.get("/orders", response_model=ResponseModel[PageResult[OrderOut]])
async def list_my_orders(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    status_enum = None
    if status:
        from app.enums import OrderStatus as OS
        try:
            status_enum = OS(status)
        except ValueError:
            pass
    items, total = await OrderService.list_orders(
        db, user_id=user.id, status=status_enum, page=page, page_size=page_size
    )
    out_items = []
    for order in items:
        out_items.append(await build_order_out(order, db))
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.get("/orders/{order_id}", response_model=ResponseModel[OrderOut])
async def get_my_order(
    order_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = await OrderService.get_order(db, order_id=order_id, user_id=user.id)
    return await get_order_detail_response(order.id, db)


@router.get("/events/{event_id}/registration-status")
async def get_registration_status(
    event_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await RegistrationService.get_user_registration_status(db, event_id, user.id)
    return ResponseModel(data=data)


async def build_order_out(order: Order, db: AsyncSession) -> OrderOut:
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    items = list(items_result.scalars().all())
    out = OrderOut.model_validate(order)
    out.items = items
    event_result = await db.execute(select(Event).where(Event.id == order.event_id))
    event = event_result.scalar_one_or_none()
    if event:
        out.event_name = event.name
    return out


async def get_order_detail_response(order_id: int, db: AsyncSession) -> ResponseModel[OrderOut]:
    order = await OrderService.get_order(db, order_id=order_id)
    data = await build_order_out(order, db)
    return ResponseModel(data=data)
