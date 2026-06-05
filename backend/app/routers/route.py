import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.route import Route, RouteStop, Courier
from app.models.elder import Elder, DietaryRestriction
from app.models.meal import MealOrder
from app.models.delivery import Delivery
from app.models.cold_box import ColdBox
from app.schemas.route import (
    RouteCreate,
    RouteOut,
    RouteOverview,
    RouteOverviewBuilding,
    RouteOverviewColdBox,
    RouteAssignCourier,
    RouteStopOut,
    CourierOut,
    TodayDashboard,
)

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("/overview/{route_id}", response_model=RouteOverview)
def get_route_overview(route_id: uuid.UUID, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    stops = db.query(RouteStop).filter(RouteStop.route_id == route_id).all()

    building_map: dict[str, dict] = {}
    for stop in stops:
        b = stop.building
        if b not in building_map:
            building_map[b] = {
                "building": b,
                "elder_count": 0,
                "meal_count": 0,
                "dietary_conflicts": 0,
                "unsigned_count": 0,
            }
        building_map[b]["elder_count"] += 1
        building_map[b]["meal_count"] += stop.meal_count

        conflicts = (
            db.query(MealOrder)
            .filter(
                MealOrder.elder_id == stop.elder_id,
                MealOrder.order_date == str(route.date),
                MealOrder.has_dietary_conflict == True,
            )
            .count()
        )
        building_map[b]["dietary_conflicts"] += conflicts

        unsigned = (
            db.query(Delivery)
            .filter(
                Delivery.route_id == route_id,
                Delivery.elder_id == stop.elder_id,
                Delivery.status == "pending",
            )
            .count()
        )
        building_map[b]["unsigned_count"] += unsigned

    cold_box = db.query(ColdBox).filter(ColdBox.route_id == route_id).first()
    cold_box_out = None
    if cold_box:
        cold_box_out = RouteOverviewColdBox(
            id=cold_box.id,
            serial_number=cold_box.serial_number,
            current_temp=cold_box.current_temp,
            is_abnormal=cold_box.is_abnormal,
        )

    unsigned_deliveries = (
        db.query(Delivery)
        .filter(Delivery.route_id == route_id, Delivery.status == "pending")
        .all()
    )
    unsigned_list = []
    for d in unsigned_deliveries:
        elder = db.query(Elder).filter(Elder.id == d.elder_id).first()
        unsigned_list.append(
            {
                "delivery_id": str(d.id),
                "elder_id": str(d.elder_id),
                "elder_name": elder.name if elder else "Unknown",
                "building": elder.building if elder else "",
                "room": elder.room if elder else "",
            }
        )

    total_meals = sum(b["meal_count"] for b in building_map.values())
    total_conflicts = sum(b["dietary_conflicts"] for b in building_map.values())

    return RouteOverview(
        route_id=route.id,
        route_name=route.name,
        route_date=route.date,
        status=route.status,
        buildings=list(building_map.values()),
        total_meals=total_meals,
        total_conflicts=total_conflicts,
        cold_box=cold_box_out,
        unsigned_list=unsigned_list,
    )


@router.get("/today/dashboard", response_model=TodayDashboard)
def get_today_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    routes = db.query(Route).filter(Route.date == today).all()

    route_outs = []
    for route in routes:
        stops_out = []
        for stop in route.stops:
            elder = db.query(Elder).filter(Elder.id == stop.elder_id).first()
            stops_out.append(
                RouteStopOut(
                    id=stop.id,
                    elder_id=stop.elder_id,
                    stop_order=stop.stop_order,
                    building=stop.building,
                    meal_count=stop.meal_count,
                    elder_name=elder.name if elder else None,
                )
            )
        courier_name = route.courier.name if route.courier else None
        route_outs.append(
            RouteOut(
                id=route.id,
                name=route.name,
                date=route.date,
                courier_id=route.courier_id,
                status=route.status,
                total_stops=route.total_stops,
                created_at=route.created_at,
                stops=stops_out,
                courier_name=courier_name,
            )
        )

    building_map: dict[str, dict] = {}
    total_conflicts = 0
    for route in routes:
        stops = db.query(RouteStop).filter(RouteStop.route_id == route.id).all()
        for stop in stops:
            b = stop.building
            if b not in building_map:
                building_map[b] = {
                    "building": b,
                    "elder_count": 0,
                    "meal_count": 0,
                    "dietary_conflicts": 0,
                    "unsigned_count": 0,
                }
            building_map[b]["elder_count"] += 1
            building_map[b]["meal_count"] += stop.meal_count

            conflicts = (
                db.query(MealOrder)
                .filter(
                    MealOrder.elder_id == stop.elder_id,
                    MealOrder.order_date == str(today),
                    MealOrder.has_dietary_conflict == True,
                )
                .count()
            )
            building_map[b]["dietary_conflicts"] += conflicts
            total_conflicts += conflicts

            unsigned = (
                db.query(Delivery)
                .filter(
                    Delivery.route_id == route.id,
                    Delivery.elder_id == stop.elder_id,
                    Delivery.status == "pending",
                )
                .count()
            )
            building_map[b]["unsigned_count"] += unsigned

    total_meals = sum(b["meal_count"] for b in building_map.values())

    abnormal_boxes = db.query(ColdBox).filter(
        ColdBox.is_abnormal == True,
        ColdBox.route_id.in_([r.id for r in routes]),
    ).all() if routes else []
    cold_box_abnormal_list = [
        RouteOverviewColdBox(
            id=cb.id,
            serial_number=cb.serial_number,
            current_temp=cb.current_temp,
            is_abnormal=cb.is_abnormal,
        )
        for cb in abnormal_boxes
    ]

    unsigned_deliveries = []
    if routes:
        unsigned_deliveries = (
            db.query(Delivery)
            .filter(
                Delivery.route_id.in_([r.id for r in routes]),
                Delivery.status == "pending",
            )
            .all()
        )
    unsigned_list = []
    for d in unsigned_deliveries:
        elder = db.query(Elder).filter(Elder.id == d.elder_id).first()
        unsigned_list.append({
            "delivery_id": str(d.id),
            "elder_id": str(d.elder_id),
            "elder_name": elder.name if elder else "Unknown",
            "building": elder.building if elder else "",
            "room": elder.room if elder else "",
        })

    return TodayDashboard(
        routes=route_outs,
        buildings=list(building_map.values()),
        total_meals=total_meals,
        total_conflicts=total_conflicts,
        cold_box_abnormal_count=len(cold_box_abnormal_list),
        cold_box_abnormal_list=cold_box_abnormal_list,
        unsigned_list=unsigned_list,
    )


@router.get("/today", response_model=list[RouteOut])
def get_today_routes(db: Session = Depends(get_db)):
    today = date.today()
    routes = db.query(Route).filter(Route.date == today).all()
    result = []
    for route in routes:
        stops_out = []
        for stop in route.stops:
            elder = db.query(Elder).filter(Elder.id == stop.elder_id).first()
            stops_out.append(
                RouteStopOut(
                    id=stop.id,
                    elder_id=stop.elder_id,
                    stop_order=stop.stop_order,
                    building=stop.building,
                    meal_count=stop.meal_count,
                    elder_name=elder.name if elder else None,
                )
            )
        courier_name = None
        if route.courier:
            courier_name = route.courier.name
        result.append(
            RouteOut(
                id=route.id,
                name=route.name,
                date=route.date,
                courier_id=route.courier_id,
                status=route.status,
                total_stops=route.total_stops,
                created_at=route.created_at,
                stops=stops_out,
                courier_name=courier_name,
            )
        )
    return result


@router.post("/", response_model=RouteOut)
def create_route(data: RouteCreate, db: Session = Depends(get_db)):
    route = Route(
        name=data.name,
        date=data.date,
        courier_id=data.courier_id,
        total_stops=len(data.stop_elder_ids),
    )
    db.add(route)
    db.flush()

    for idx, elder_id in enumerate(data.stop_elder_ids, 1):
        elder = db.query(Elder).filter(Elder.id == elder_id).first()
        if not elder:
            raise HTTPException(status_code=404, detail=f"Elder {elder_id} not found")
        stop = RouteStop(
            route_id=route.id,
            elder_id=elder_id,
            stop_order=idx,
            building=elder.building,
        )
        db.add(stop)

    db.commit()
    db.refresh(route)
    return route


@router.put("/{route_id}/assign-courier", response_model=RouteOut)
def assign_courier(
    route_id: uuid.UUID, data: RouteAssignCourier, db: Session = Depends(get_db)
):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    courier = db.query(Courier).filter(Courier.id == data.courier_id).first()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")

    route.courier_id = data.courier_id
    route.status = "assigned"
    db.commit()
    db.refresh(route)
    return route


@router.get("/couriers", response_model=list[CourierOut])
def list_couriers(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Courier)
    if active_only:
        query = query.filter(Courier.is_active == True)
    return query.all()
