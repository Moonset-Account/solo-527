from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from app.models.models import Cleaner, Room, WorkOrder, Rework, ShiftHandover
from app.schemas import (
    FloorHeatmapCell, ReworkTrendPoint, ShiftComparisonItem,
    CleanerPerformance, FilterParams
)
from datetime import date, timedelta
from typing import List, Optional


def apply_filters(query, filters: FilterParams):
    if filters.start_date:
        query = query.filter(WorkOrder.date >= filters.start_date)
    if filters.end_date:
        query = query.filter(WorkOrder.date <= filters.end_date)
    if filters.floor:
        query = query.filter(Room.floor == filters.floor)
    if filters.shift:
        query = query.filter(WorkOrder.shift == filters.shift)
    if filters.is_vip is not None:
        query = query.filter(WorkOrder.is_vip == filters.is_vip)
    if filters.is_late_checkout is not None:
        query = query.filter(WorkOrder.is_late_checkout == filters.is_late_checkout)
    if filters.cleaner_id:
        query = query.filter(WorkOrder.cleaner_id == filters.cleaner_id)
    return query


def get_floor_heatmap(db: Session, filters: FilterParams) -> List[FloorHeatmapCell]:
    query = (
        db.query(
            Room.room_number,
            Room.floor,
            Room.room_type,
            Room.is_vip,
            WorkOrder.is_late_checkout,
            WorkOrder.status,
            func.avg(WorkOrder.cleaning_duration).label("avg_duration"),
            func.count(Rework.id).label("rework_count"),
        )
        .join(WorkOrder, Room.id == WorkOrder.room_id)
        .outerjoin(Rework, WorkOrder.id == Rework.work_order_id)
        .filter(WorkOrder.cleaning_duration.isnot(None))
    )
    query = apply_filters(query, filters)
    results = query.group_by(
        Room.room_number, Room.floor, Room.room_type, Room.is_vip,
        WorkOrder.is_late_checkout, WorkOrder.status
    ).all()

    return [
        FloorHeatmapCell(
            room_number=r.room_number,
            floor=r.floor,
            room_type=r.room_type,
            is_vip=r.is_vip,
            is_late_checkout=r.is_late_checkout,
            status=r.status,
            avg_duration=round(r.avg_duration, 1) if r.avg_duration else None,
            rework_count=r.rework_count,
        )
        for r in results
    ]


def get_rework_trend(db: Session, filters: FilterParams) -> List[ReworkTrendPoint]:
    base = (
        db.query(WorkOrder)
        .join(Room, WorkOrder.room_id == Room.id)
        .filter(WorkOrder.cleaning_duration.isnot(None))
    )
    base = apply_filters(base, filters)
    base = base.filter(WorkOrder.is_late_checkout == False)

    start = filters.start_date or date.today() - timedelta(days=30)
    end = filters.end_date or date.today()
    delta = (end - start).days

    points = []
    for i in range(delta + 1):
        d = start + timedelta(days=i)
        day_orders = base.filter(WorkOrder.date == d).all()
        if not day_orders:
            points.append(ReworkTrendPoint(date=d.isoformat()))
            continue

        order_ids = [o.id for o in day_orders]
        day_reworks = db.query(Rework).filter(Rework.work_order_id.in_(order_ids)).all()

        vip_orders = [o for o in day_orders if o.is_vip]
        normal_orders = [o for o in day_orders if not o.is_vip]

        vip_rework_count = sum(1 for r in day_reworks if r.is_vip)
        normal_rework_count = sum(1 for r in day_reworks if not r.is_vip)

        total = len(day_orders)
        vip_total = len(vip_orders)
        normal_total = len(normal_orders)

        vip_dur = [o.cleaning_duration for o in vip_orders if o.cleaning_duration]
        normal_dur = [o.cleaning_duration for o in normal_orders if o.cleaning_duration]

        reason_counts = {}
        for r in day_reworks:
            reason_counts[r.reason] = reason_counts.get(r.reason, 0) + 1
        top_reasons = sorted(
            [{"reason": k, "count": v} for k, v in reason_counts.items()],
            key=lambda x: x["count"], reverse=True
        )[:5]

        points.append(ReworkTrendPoint(
            date=d.isoformat(),
            rework_rate_vip=round(vip_rework_count / vip_total * 100, 1) if vip_total else None,
            rework_rate_normal=round(normal_rework_count / normal_total * 100, 1) if normal_total else None,
            rework_rate_total=round(len(day_reworks) / total * 100, 1) if total else None,
            avg_duration_vip=round(sum(vip_dur) / len(vip_dur), 1) if vip_dur else None,
            avg_duration_normal=round(sum(normal_dur) / len(normal_dur), 1) if normal_dur else None,
            top_reasons=top_reasons,
        ))

    return points


def get_shift_comparison(db: Session, filters: FilterParams) -> List[ShiftComparisonItem]:
    results = []
    for shift_name in ["morning", "afternoon", "evening"]:
        shift_filters = FilterParams(**{**filters.model_dump(), "shift": shift_name})
        query = (
            db.query(WorkOrder)
            .join(Room, WorkOrder.room_id == Room.id)
            .filter(WorkOrder.cleaning_duration.isnot(None))
            .filter(WorkOrder.is_late_checkout == False)
        )
        query = apply_filters(query, shift_filters)
        orders = query.all()

        if not orders:
            results.append(ShiftComparisonItem(shift=shift_name, total_orders=0))
            continue

        order_ids = [o.id for o in orders]
        reworks = db.query(Rework).filter(Rework.work_order_id.in_(order_ids)).all()

        vip_orders = [o for o in orders if o.is_vip]
        normal_orders = [o for o in orders if not o.is_vip]

        vip_dur = [o.cleaning_duration for o in vip_orders if o.cleaning_duration]
        normal_dur = [o.cleaning_duration for o in normal_orders if o.cleaning_duration]

        vip_rework = sum(1 for r in reworks if r.is_vip)
        normal_rework = sum(1 for r in reworks if not r.is_vip)

        results.append(ShiftComparisonItem(
            shift=shift_name,
            total_orders=len(orders),
            avg_duration_vip=round(sum(vip_dur) / len(vip_dur), 1) if vip_dur else None,
            avg_duration_normal=round(sum(normal_dur) / len(normal_dur), 1) if normal_dur else None,
            rework_rate_vip=round(vip_rework / len(vip_orders) * 100, 1) if vip_orders else None,
            rework_rate_normal=round(normal_rework / len(normal_orders) * 100, 1) if normal_orders else None,
        ))

    return results


def get_work_orders_detail(db: Session, filters: FilterParams) -> list:
    query = (
        db.query(WorkOrder)
        .join(Room, WorkOrder.room_id == Room.id)
        .join(Cleaner, WorkOrder.cleaner_id == Cleaner.id)
    )
    query = apply_filters(query, filters)
    orders = query.order_by(WorkOrder.date.desc(), WorkOrder.assigned_at.desc()).all()

    result = []
    for o in orders:
        reworks = db.query(Rework).filter(Rework.work_order_id == o.id).all()
        handovers = db.query(ShiftHandover).filter(ShiftHandover.work_order_id == o.id).all()

        rework_data = []
        for r in reworks:
            cleaner_name = None
            if r.reassigned_cleaner_id:
                c = db.query(Cleaner).filter(Cleaner.id == r.reassigned_cleaner_id).first()
                cleaner_name = c.name if c else None
            rework_data.append({
                "id": r.id,
                "reason": r.reason,
                "missing_item": r.missing_item,
                "rework_time": r.rework_time.isoformat() if r.rework_time else None,
                "minutes_after_inspection": r.minutes_after_inspection,
                "reassigned_cleaner_name": cleaner_name,
                "rework_duration": r.rework_duration,
                "is_vip": r.is_vip,
            })

        handover_data = []
        for h in handovers:
            from_c = db.query(Cleaner).filter(Cleaner.id == h.from_cleaner_id).first()
            to_c = db.query(Cleaner).filter(Cleaner.id == h.to_cleaner_id).first()
            handover_data.append({
                "id": h.id,
                "from_cleaner_name": from_c.name if from_c else None,
                "to_cleaner_name": to_c.name if to_c else None,
                "handover_time": h.handover_time.isoformat() if h.handover_time else None,
                "from_duration": h.from_duration,
                "to_duration": h.to_duration,
                "note": h.note,
            })

        result.append({
            "id": o.id,
            "order_number": o.order_number,
            "room_number": o.room.room_number,
            "floor": o.room.floor,
            "room_type": o.room.room_type,
            "is_vip": o.is_vip,
            "is_late_checkout": o.is_late_checkout,
            "cleaner_name": o.cleaner.name,
            "cleaner_id": o.cleaner_id,
            "shift": o.shift,
            "status": o.status,
            "assigned_at": o.assigned_at.isoformat() if o.assigned_at else None,
            "start_time": o.start_time.isoformat() if o.start_time else None,
            "end_time": o.end_time.isoformat() if o.end_time else None,
            "inspection_time": o.inspection_time.isoformat() if o.inspection_time else None,
            "cleaning_duration": o.cleaning_duration,
            "date": o.date.isoformat() if o.date else None,
            "note": o.note,
            "reworks": rework_data,
            "handovers": handover_data,
        })

    return result


def get_cleaner_performance(db: Session, filters: FilterParams) -> List[CleanerPerformance]:
    cleaners = db.query(Cleaner).filter(Cleaner.is_active == True).all()
    all_handovers = db.query(ShiftHandover).all()
    handover_map: dict = {}
    for h in all_handovers:
        if h.work_order_id not in handover_map:
            handover_map[h.work_order_id] = []
        handover_map[h.work_order_id].append(h)

    results = []

    for c in cleaners:
        c_filters = FilterParams(**{**filters.model_dump(), "cleaner_id": c.id})
        query = (
            db.query(WorkOrder)
            .join(Room, WorkOrder.room_id == Room.id)
            .filter(WorkOrder.is_late_checkout == False)
            .filter(WorkOrder.cleaning_duration.isnot(None))
        )
        query = apply_filters(query, c_filters)
        primary_orders = query.all()

        primary_order_ids = {o.id for o in primary_orders}

        takeover_order_ids = set()
        for h in all_handovers:
            if h.to_cleaner_id == c.id and h.work_order_id not in primary_order_ids:
                takeover_order_ids.add(h.work_order_id)

        takeover_orders = []
        if takeover_order_ids:
            takeover_orders = db.query(WorkOrder).filter(
                WorkOrder.id.in_(takeover_order_ids),
                WorkOrder.is_late_checkout == False,
                WorkOrder.cleaning_duration.isnot(None),
            ).all()
            if filters.start_date:
                takeover_orders = [o for o in takeover_orders if o.date >= filters.start_date]
            if filters.end_date:
                takeover_orders = [o for o in takeover_orders if o.date <= filters.end_date]
            if filters.floor:
                room_ids = {o.room_id for o in takeover_orders}
                rooms = db.query(Room).filter(Room.id.in_(room_ids)).all()
                floor_rooms = {r.id for r in rooms if r.floor == filters.floor}
                takeover_orders = [o for o in takeover_orders if o.room_id in floor_rooms]
            if filters.shift:
                takeover_orders = [o for o in takeover_orders if o.shift == filters.shift]
            if filters.is_vip is not None:
                takeover_orders = [o for o in takeover_orders if o.is_vip == filters.is_vip]

        effective_vip_dur = []
        effective_normal_dur = []
        handover_from_total = 0.0
        handover_to_total = 0.0
        handover_count = 0

        for o in primary_orders:
            h_list = handover_map.get(o.id, [])
            involved = [h for h in h_list if h.from_cleaner_id == c.id or h.to_cleaner_id == c.id]
            if involved:
                for h in involved:
                    if h.from_cleaner_id == c.id and h.from_duration is not None:
                        dur = h.from_duration
                        handover_from_total += dur
                        handover_count += 1
                        if o.is_vip:
                            effective_vip_dur.append(dur)
                        else:
                            effective_normal_dur.append(dur)
                    if h.to_cleaner_id == c.id and h.to_duration is not None:
                        dur = h.to_duration
                        handover_to_total += dur
                        handover_count += 1
                        if o.is_vip:
                            effective_vip_dur.append(dur)
                        else:
                            effective_normal_dur.append(dur)
            else:
                if o.cleaning_duration is not None:
                    if o.is_vip:
                        effective_vip_dur.append(o.cleaning_duration)
                    else:
                        effective_normal_dur.append(o.cleaning_duration)

        for o in takeover_orders:
            h_list = handover_map.get(o.id, [])
            for h in h_list:
                if h.to_cleaner_id == c.id and h.to_duration is not None:
                    dur = h.to_duration
                    handover_to_total += dur
                    handover_count += 1
                    if o.is_vip:
                        effective_vip_dur.append(dur)
                    else:
                        effective_normal_dur.append(dur)

        all_effective_dur = effective_vip_dur + effective_normal_dur

        all_order_ids = list(primary_order_ids | takeover_order_ids)
        reworks = db.query(Rework).filter(Rework.work_order_id.in_(all_order_ids)).all() if all_order_ids else []
        vip_rework = sum(1 for r in reworks if r.is_vip)
        normal_rework = sum(1 for r in reworks if not r.is_vip)

        vip_order_count = len([o for o in primary_orders if o.is_vip]) + len([o for o in takeover_orders if o.is_vip])
        normal_order_count = len([o for o in primary_orders if not o.is_vip]) + len([o for o in takeover_orders if not o.is_vip])

        mins_after = [r.minutes_after_inspection for r in reworks if r.minutes_after_inspection is not None]

        results.append(CleanerPerformance(
            cleaner_id=c.id,
            cleaner_name=c.name,
            shift=c.shift,
            total_orders=len(primary_orders) + len(takeover_orders),
            vip_orders=vip_order_count,
            normal_orders=normal_order_count,
            avg_duration=round(sum(all_effective_dur) / len(all_effective_dur), 1) if all_effective_dur else None,
            avg_duration_vip=round(sum(effective_vip_dur) / len(effective_vip_dur), 1) if effective_vip_dur else None,
            avg_duration_normal=round(sum(effective_normal_dur) / len(effective_normal_dur), 1) if effective_normal_dur else None,
            rework_count=len(reworks),
            rework_rate=round(len(reworks) / (len(primary_orders) + len(takeover_orders)) * 100, 1) if (len(primary_orders) + len(takeover_orders)) else None,
            rework_rate_vip=round(vip_rework / vip_order_count * 100, 1) if vip_order_count else None,
            rework_rate_normal=round(normal_rework / normal_order_count * 100, 1) if normal_order_count else None,
            handover_count=handover_count,
            handover_from_duration_total=round(handover_from_total, 1) if handover_from_total else None,
            handover_to_duration_total=round(handover_to_total, 1) if handover_to_total else None,
            avg_minutes_after_inspection=round(sum(mins_after) / len(mins_after), 1) if mins_after else None,
        ))

    return results
