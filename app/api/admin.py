from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, update

from app.database import get_db
from app.models import (
    Event, Seat, TicketType, TicketTypeConfig, Order, OrderItem,
    SystemConfig, RepeatSeatAlert,
)
from app.enums import (
    EventStatus, SeatStatus, ConfigStatus, UserRole, SeatArea, TicketType as TTEnum
)
from app.schemas.common import (
    ResponseModel, PageResult, EventCreate, EventUpdate, EventOut,
    SeatCreate, SeatUpdate, SeatOut, TicketTypeCreate, TicketTypeUpdate, TicketTypeOut,
    TicketTypeConfigCreate, TicketTypeConfigUpdate, TicketTypeConfigOut,
    OrderOut, OrderUpdate, SystemConfigCreate, SystemConfigUpdate, SystemConfigOut,
    RepeatSeatAlertOut, AlertResolveRequest, EventSeatGenerateRequest,
)
from app.dependencies import get_current_user, require_roles
from app.utils import paginate, calc_offset, calc_occupancy_rate, now
from app.services.order_service import OrderService
from app.services.config_service import ConfigService
from app.services.report_service import ReportService
from app.services.seat_lock import seat_lock_service

router = APIRouter(prefix="/admin", tags=["后台管理"])

admin_required = require_roles(UserRole.ADMIN, UserRole.OPERATOR)
finance_required = require_roles(UserRole.ADMIN, UserRole.FINANCE)


@router.get("/events", response_model=ResponseModel[PageResult[EventOut]])
async def list_events(
    page: int = 1,
    page_size: int = 20,
    status: Optional[EventStatus] = None,
    keyword: Optional[str] = None,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    offset = calc_offset(page, page_size)
    query = select(Event)
    count_q = select(func.count(Event.id))
    conditions = []
    if status:
        conditions.append(Event.status == status)
    if keyword:
        like = f"%{keyword}%"
        conditions.append(or_(Event.name.ilike(like), Event.code.ilike(like),
                               Event.artist.ilike(like), Event.venue.ilike(like)))
    if conditions:
        query = query.where(and_(*conditions))
        count_q = count_q.where(and_(*conditions))
    total = (await db.execute(count_q)).scalar() or 0
    query = query.order_by(Event.created_at.desc()).offset(offset).limit(page_size)
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


@router.post("/events", response_model=ResponseModel[EventOut])
async def create_event(
    data: EventCreate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Event.id).where(Event.code == data.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="场次编码已存在")
    event = Event(**data.model_dump(), created_by=user.id, updated_by=user.id)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return ResponseModel(data=EventOut.model_validate(event))


@router.get("/events/{event_id}", response_model=ResponseModel[EventOut])
async def get_event(
    event_id: int,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="场次不存在")
    eo = EventOut.model_validate(event)
    eo.occupancy_rate = calc_occupancy_rate(event.sold_seats, event.total_seats)
    return ResponseModel(data=eo)


@router.put("/events/{event_id}", response_model=ResponseModel[EventOut])
async def update_event(
    event_id: int,
    data: EventUpdate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="场次不存在")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None and hasattr(event, k):
            setattr(event, k, v)
    event.updated_by = user.id
    await db.commit()
    await db.refresh(event)
    await seat_lock_service.invalidate_event_cache(event_id)
    return ResponseModel(data=EventOut.model_validate(event))


@router.post("/events/{event_id}/status", response_model=ResponseModel[EventOut])
async def set_event_status(
    event_id: int,
    status: EventStatus,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="场次不存在")
    event.status = status
    event.updated_by = user.id
    await db.commit()
    await db.refresh(event)
    await seat_lock_service.invalidate_event_cache(event_id)
    return ResponseModel(data=EventOut.model_validate(event))


@router.post("/events/generate-seats")
async def generate_event_seats(
    data: EventSeatGenerateRequest,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == data.event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="场次不存在")
    existing_count = (await db.execute(select(func.count(Seat.id)).where(Seat.event_id == data.event_id))).scalar() or 0
    if existing_count > 0:
        raise HTTPException(status_code=400, detail="该场次已存在座位数据，请先清空")
    area_map = {
        "vip": SeatArea.VIP,
        "front": SeatArea.FRONT,
        "middle": SeatArea.MIDDLE,
        "back": SeatArea.BACK,
        "standing": SeatArea.STANDING,
    }
    created = 0
    for layout in data.layouts:
        area_key = layout.get("area", "back")
        area = area_map.get(area_key, SeatArea.BACK)
        rows = layout.get("rows", 10)
        cols = layout.get("cols", 10)
        row_prefix = layout.get("row_prefix", "")
        price = float(layout.get("price", 0))
        start_row = layout.get("start_row", 1)
        for r in range(rows):
            row_num = start_row + r
            row_label = f"{row_prefix}{row_num}" if row_prefix else str(row_num)
            for c in range(1, cols + 1):
                blocked_positions = layout.get("blocked", [])
                is_blocked = any(bp.get("row") == row_num and c in bp.get("cols", []) for bp in blocked_positions)
                seat = Seat(
                    event_id=data.event_id,
                    seat_code=f"{area.value.upper()}-{row_label}-{c:02d}",
                    row=row_label,
                    col=c,
                    area=area,
                    status=SeatStatus.BLOCKED if is_blocked else SeatStatus.AVAILABLE,
                    base_price=price,
                    current_price=price,
                    created_by=user.id,
                    updated_by=user.id,
                )
                db.add(seat)
                created += 1
    await db.commit()
    await OrderService._update_event_stats(db, data.event_id)
    return ResponseModel(data={"created": created, "event_id": data.event_id})


@router.delete("/events/{event_id}/seats", response_model=ResponseModel)
async def clear_event_seats(
    event_id: int,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    check = await db.execute(select(Seat.id).where(and_(
        Seat.event_id == event_id,
        Seat.status.in_([SeatStatus.SOLD, SeatStatus.LOCKED, SeatStatus.REFUNDED]),
    )).limit(1))
    if check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="存在已售或锁定的座位，无法清空")
    from sqlalchemy import delete
    await db.execute(delete(Seat).where(Seat.event_id == event_id))
    await OrderService._update_event_stats(db, event_id)
    await seat_lock_service.invalidate_event_cache(event_id)
    return ResponseModel(message="座位已清空")


@router.get("/events/{event_id}/seats", response_model=ResponseModel[list[SeatOut]])
async def list_event_seats_admin(
    event_id: int,
    area: Optional[SeatArea] = None,
    status: Optional[SeatStatus] = None,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    query = select(Seat).where(Seat.event_id == event_id)
    if area:
        query = query.where(Seat.area == area)
    if status:
        query = query.where(Seat.status == status)
    query = query.order_by(Seat.area, Seat.row, Seat.col)
    result = await db.execute(query)
    seats = list(result.scalars().all())
    items = [SeatOut.model_validate(s) for s in seats]
    return ResponseModel(data=items)


@router.put("/seats/{seat_id}", response_model=ResponseModel[SeatOut])
async def update_seat(
    seat_id: int,
    data: SeatUpdate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Seat).where(Seat.id == seat_id))
    seat = result.scalar_one_or_none()
    if not seat:
        raise HTTPException(status_code=404, detail="座位不存在")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None and hasattr(seat, k):
            setattr(seat, k, v)
    seat.updated_by = user.id
    await db.commit()
    await db.refresh(seat)
    await seat_lock_service.invalidate_event_cache(seat.event_id)
    return ResponseModel(data=SeatOut.model_validate(seat))


@router.post("/seats/batch-status", response_model=ResponseModel)
async def batch_update_seat_status(
    seat_ids: List[int],
    status: SeatStatus,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Seat).where(Seat.id.in_(seat_ids)))
    seats = list(result.scalars().all())
    event_ids = set()
    for seat in seats:
        if seat.status in (SeatStatus.SOLD, SeatStatus.REFUNDED) and status in (SeatStatus.AVAILABLE, SeatStatus.BLOCKED, SeatStatus.RESERVED):
            continue
        seat.status = status
        seat.updated_by = user.id
        event_ids.add(seat.event_id)
    await db.commit()
    for eid in event_ids:
        await OrderService._update_event_stats(db, eid)
        await seat_lock_service.invalidate_event_cache(eid)
    return ResponseModel(data={"updated": len(seats)})


@router.get("/ticket-types", response_model=ResponseModel[list[TicketTypeOut]])
async def list_ticket_types(
    type: Optional[TTEnum] = None,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    query = select(TicketType)
    if type:
        query = query.where(TicketType.type == type)
    query = query.order_by(TicketType.sort_order, TicketType.id)
    result = await db.execute(query)
    items = [TicketTypeOut.model_validate(t) for t in result.scalars().all()]
    return ResponseModel(data=items)


@router.post("/ticket-types", response_model=ResponseModel[TicketTypeOut])
async def create_ticket_type(
    data: TicketTypeCreate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(TicketType.id).where(TicketType.code == data.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="票种编码已存在")
    obj = TicketType(**data.model_dump(), created_by=user.id, updated_by=user.id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return ResponseModel(data=TicketTypeOut.model_validate(obj))


@router.put("/ticket-types/{type_id}", response_model=ResponseModel[TicketTypeOut])
async def update_ticket_type(
    type_id: int,
    data: TicketTypeUpdate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TicketType).where(TicketType.id == type_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="票种不存在")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None and hasattr(obj, k):
            setattr(obj, k, v)
    obj.updated_by = user.id
    await db.commit()
    await db.refresh(obj)
    return ResponseModel(data=TicketTypeOut.model_validate(obj))


@router.get("/events/{event_id}/ticket-type-configs", response_model=ResponseModel[list[TicketTypeConfigOut]])
async def list_event_ticket_configs(
    event_id: int,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TicketTypeConfig).where(
        TicketTypeConfig.event_id == event_id
    ).order_by(TicketTypeConfig.sort_order))
    configs = list(result.scalars().all())
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


@router.post("/ticket-type-configs", response_model=ResponseModel[TicketTypeConfigOut])
async def create_ticket_type_config(
    data: TicketTypeConfigCreate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    obj = TicketTypeConfig(**data.model_dump(), created_by=user.id, updated_by=user.id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return ResponseModel(data=TicketTypeConfigOut.model_validate(obj))


@router.put("/ticket-type-configs/{cfg_id}", response_model=ResponseModel[TicketTypeConfigOut])
async def update_ticket_type_config(
    cfg_id: int,
    data: TicketTypeConfigUpdate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TicketTypeConfig).where(TicketTypeConfig.id == cfg_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="配置不存在")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None and hasattr(obj, k):
            setattr(obj, k, v)
    obj.updated_by = user.id
    await db.commit()
    await db.refresh(obj)
    return ResponseModel(data=TicketTypeConfigOut.model_validate(obj))


@router.get("/orders", response_model=ResponseModel[PageResult[OrderOut]])
async def list_orders_admin(
    page: int = 1,
    page_size: int = 20,
    event_id: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    keyword: Optional[str] = None,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime as dt
    page, page_size = paginate(page, page_size)
    status_enum = None
    if status:
        from app.enums import OrderStatus as OS
        try:
            status_enum = OS(status)
        except ValueError:
            pass
    sd = dt.fromisoformat(start_date) if start_date else None
    ed = dt.fromisoformat(end_date) if end_date else None
    items, total = await OrderService.list_orders(
        db, event_id=event_id, status=status_enum,
        start_date=sd, end_date=ed, page=page, page_size=page_size, keyword=keyword,
    )
    from app.api.public import build_order_out
    out_items = [await build_order_out(o, db) for o in items]
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.put("/orders/{order_id}", response_model=ResponseModel[OrderOut])
async def update_order_admin(
    order_id: int,
    data: OrderUpdate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    order = await OrderService.get_order(db, order_id=order_id)
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None and hasattr(order, k):
            setattr(order, k, v)
    await db.commit()
    from app.api.public import get_order_detail_response
    return await get_order_detail_response(order_id, db)


@router.post("/orders/{order_id}/cancel", response_model=ResponseModel[OrderOut])
async def cancel_order_admin(
    order_id: int,
    reason: Optional[str] = None,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    order = await OrderService.cancel_order(db, order_id, reason, admin=True)
    from app.api.public import get_order_detail_response
    return await get_order_detail_response(order_id, db)


@router.get("/configs", response_model=ResponseModel[PageResult[SystemConfigOut]])
async def list_configs(
    page: int = 1,
    page_size: int = 50,
    category: Optional[str] = None,
    status: Optional[ConfigStatus] = None,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    items, total = await ConfigService.list_by_category(db, category, status, page, page_size)
    out_items = [SystemConfigOut.model_validate(c) for c in items]
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.post("/configs", response_model=ResponseModel[SystemConfigOut])
async def create_config(
    data: SystemConfigCreate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    obj = await ConfigService.create(db, data.model_dump(), user.id)
    return ResponseModel(data=SystemConfigOut.model_validate(obj))


@router.put("/configs/{config_id}", response_model=ResponseModel[SystemConfigOut])
async def update_config(
    config_id: int,
    data: SystemConfigUpdate,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    obj = await ConfigService.update(db, config_id, data.model_dump(exclude_unset=True), user.id)
    return ResponseModel(data=SystemConfigOut.model_validate(obj))


@router.post("/configs/{config_id}/status", response_model=ResponseModel[SystemConfigOut])
async def set_config_status(
    config_id: int,
    status: ConfigStatus,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    obj = await ConfigService.set_status(db, config_id, status, user.id)
    return ResponseModel(data=SystemConfigOut.model_validate(obj))


@router.get("/alerts/repeat-seat", response_model=ResponseModel[PageResult[RepeatSeatAlertOut]])
async def list_repeat_alerts(
    page: int = 1,
    page_size: int = 20,
    is_resolved: Optional[bool] = None,
    event_id: Optional[int] = None,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    items, total = await ReportService.get_repeat_alert_report(db, is_resolved, event_id, page, page_size)
    out_items = []
    for alert in items:
        ao = RepeatSeatAlertOut.model_validate(alert)
        if alert.seat:
            ao.seat_code = alert.seat.seat_code
        if alert.event:
            ao.event_name = alert.event.name
        out_items.append(ao)
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.post("/alerts/repeat-seat/{alert_id}/resolve", response_model=ResponseModel[RepeatSeatAlertOut])
async def resolve_repeat_alert(
    alert_id: int,
    data: AlertResolveRequest,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    obj = await ReportService.resolve_alert(db, alert_id, data.resolution_note, user.id)
    ao = RepeatSeatAlertOut.model_validate(obj)
    if obj.seat:
        ao.seat_code = obj.seat.seat_code
    if obj.event:
        ao.event_name = obj.event.name
    return ResponseModel(data=ao)
