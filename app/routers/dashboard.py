from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.models import Tenant, Anomaly, Arrear

router = APIRouter()


@router.get("/")
async def dashboard_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("dashboard.html", {"request": request})


@router.get("/api/dashboard/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    tenant_count = (await db.execute(select(func.count(Tenant.id)))).scalar() or 0
    active_tenants = (await db.execute(select(func.count(Tenant.id)).where(Tenant.is_active == True))).scalar() or 0
    open_anomalies = (await db.execute(select(func.count(Anomaly.id)).where(Anomaly.status == "open"))).scalar() or 0
    unpaid_arrears = (await db.execute(select(func.count(Arrear.id)).where(Arrear.status == "unpaid"))).scalar() or 0

    avg_score = (await db.execute(select(func.avg(Tenant.health_score)))).scalar() or 0

    low_health_count = (
        await db.execute(
            select(func.count(Tenant.id)).where(Tenant.health_score < 60)
        )
    ).scalar() or 0

    total_arrears_amount = (
        await db.execute(
            select(func.coalesce(func.sum(Arrear.amount), 0)).where(Arrear.status == "unpaid")
        )
    ).scalar() or 0

    from app.services.arrears import ArrearService
    arrears_svc = ArrearService(db)
    health_summary = await arrears_svc.get_health_stats_summary()

    return {
        "tenant_count": tenant_count,
        "active_tenants": active_tenants,
        "open_anomalies": open_anomalies,
        "unpaid_arrears": unpaid_arrears,
        "health_summary": {
            "avg_health_score": round(float(avg_score), 2),
            "low_health_count": int(low_health_count),
            "total_arrears_amount": round(float(total_arrears_amount), 2),
            **health_summary,
        },
    }
