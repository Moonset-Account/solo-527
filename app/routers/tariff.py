from typing import Annotated
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Request, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.templating import Jinja2Templates

from app.database import get_db
from app.services import tariff_service

templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix="/tariff", tags=["tariff"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/")
async def tariff_page(request: Request, db: DbSession, station_id: UUID | None = Query(None)):
    prices = []
    subsidy_rules = []
    if station_id:
        prices = await tariff_service.get_active_prices(db, station_id)
        subsidy_rules = await tariff_service.get_active_subsidy_rules(db, station_id)
    context = {
        "request": request,
        "prices": prices,
        "subsidy_rules": subsidy_rules,
        "selected_station_id": station_id,
    }
    return templates.TemplateResponse("tariff.html", context)


@router.post("/prices")
async def create_price(
    request: Request,
    db: DbSession,
    station_id: UUID = Form(...),
    period_type: str = Form(...),
    price_per_kwh: float = Form(...),
    effective_date: date = Form(...),
    created_by: str = Form(...),
    expiry_date: date = Form(None),
):
    price = await tariff_service.create_electricity_price(
        db,
        station_id=station_id,
        period_type=period_type,
        price_per_kwh=price_per_kwh,
        effective_date=effective_date,
        created_by=created_by,
        expiry_date=expiry_date,
    )
    await db.commit()
    return templates.TemplateResponse(
        "partials/price_row.html", {"request": request, "price": price}
    )


@router.put("/prices/{price_id}")
async def update_price(
    request: Request,
    db: DbSession,
    price_id: UUID,
    period_type: str = Form(None),
    price_per_kwh: float = Form(None),
    effective_date: date = Form(None),
    expiry_date: date = Form(None),
):
    kwargs = {}
    if period_type is not None:
        kwargs["period_type"] = period_type
    if price_per_kwh is not None:
        kwargs["price_per_kwh"] = price_per_kwh
    if effective_date is not None:
        kwargs["effective_date"] = effective_date
    if expiry_date is not None:
        kwargs["expiry_date"] = expiry_date
    price = await tariff_service.update_electricity_price(db, price_id, **kwargs)
    await db.commit()
    return templates.TemplateResponse(
        "partials/price_row.html", {"request": request, "price": price}
    )


@router.post("/prices/{price_id}/rollback")
async def rollback_price(
    request: Request, db: DbSession, price_id: UUID, target_version: int = Form(...)
):
    price = await tariff_service.rollback_electricity_price(db, price_id, target_version)
    await db.commit()
    return templates.TemplateResponse(
        "partials/price_row.html", {"request": request, "price": price}
    )


@router.get("/prices/{price_id}/history")
async def price_version_history(request: Request, db: DbSession, price_id: UUID):
    history = await tariff_service.get_price_version_history(db, price_id)
    return templates.TemplateResponse(
        "partials/version_history.html", {"request": request, "history": history}
    )


@router.post("/subsidies")
async def create_subsidy(
    request: Request,
    db: DbSession,
    station_id: UUID = Form(...),
    rule_name: str = Form(...),
    subsidy_type: str = Form(...),
    rate_per_kwh: float = Form(...),
    effective_date: date = Form(...),
    created_by: str = Form(...),
    description: str = Form(None),
    expiry_date: date = Form(None),
):
    rule = await tariff_service.create_subsidy_rule(
        db,
        station_id=station_id,
        rule_name=rule_name,
        subsidy_type=subsidy_type,
        rate_per_kwh=rate_per_kwh,
        effective_date=effective_date,
        created_by=created_by,
        description=description,
        expiry_date=expiry_date,
    )
    await db.commit()
    return templates.TemplateResponse(
        "partials/subsidy_row.html", {"request": request, "rule": rule}
    )


@router.put("/subsidies/{rule_id}")
async def update_subsidy(
    request: Request,
    db: DbSession,
    rule_id: UUID,
    rule_name: str = Form(None),
    subsidy_type: str = Form(None),
    rate_per_kwh: float = Form(None),
    effective_date: date = Form(None),
    expiry_date: date = Form(None),
    description: str = Form(None),
):
    kwargs = {}
    if rule_name is not None:
        kwargs["rule_name"] = rule_name
    if subsidy_type is not None:
        kwargs["subsidy_type"] = subsidy_type
    if rate_per_kwh is not None:
        kwargs["rate_per_kwh"] = rate_per_kwh
    if effective_date is not None:
        kwargs["effective_date"] = effective_date
    if expiry_date is not None:
        kwargs["expiry_date"] = expiry_date
    if description is not None:
        kwargs["description"] = description
    rule = await tariff_service.update_subsidy_rule(db, rule_id, **kwargs)
    await db.commit()
    return templates.TemplateResponse(
        "partials/subsidy_row.html", {"request": request, "rule": rule}
    )


@router.post("/subsidies/{rule_id}/rollback")
async def rollback_subsidy(
    request: Request, db: DbSession, rule_id: UUID, target_version: int = Form(...)
):
    rule = await tariff_service.rollback_subsidy_rule(db, rule_id, target_version)
    await db.commit()
    return templates.TemplateResponse(
        "partials/subsidy_row.html", {"request": request, "rule": rule}
    )


@router.get("/subsidies/{rule_id}/history")
async def subsidy_version_history(request: Request, db: DbSession, rule_id: UUID):
    history = await tariff_service.get_subsidy_version_history(db, rule_id)
    return templates.TemplateResponse(
        "partials/version_history.html", {"request": request, "history": history}
    )


@router.get("/api/prices", tags=["api"])
async def api_active_prices(db: DbSession, station_id: UUID = Query(...)):
    prices = await tariff_service.get_active_prices(db, station_id)
    return [
        {
            "id": str(p.id),
            "station_id": str(p.station_id),
            "period_type": p.period_type,
            "price_per_kwh": p.price_per_kwh,
            "effective_date": p.effective_date.isoformat() if p.effective_date else None,
            "expiry_date": p.expiry_date.isoformat() if p.expiry_date else None,
            "version": p.version,
            "is_active": p.is_active,
            "created_by": p.created_by,
        }
        for p in prices
    ]


@router.get("/api/subsidies", tags=["api"])
async def api_active_subsidies(db: DbSession, station_id: UUID = Query(...)):
    rules = await tariff_service.get_active_subsidy_rules(db, station_id)
    return [
        {
            "id": str(r.id),
            "station_id": str(r.station_id),
            "rule_name": r.rule_name,
            "subsidy_type": r.subsidy_type,
            "rate_per_kwh": r.rate_per_kwh,
            "effective_date": r.effective_date.isoformat() if r.effective_date else None,
            "expiry_date": r.expiry_date.isoformat() if r.expiry_date else None,
            "version": r.version,
            "is_active": r.is_active,
            "created_by": r.created_by,
            "description": r.description,
        }
        for r in rules
    ]
