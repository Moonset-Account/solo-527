from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, case
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, is_test_user
from app.models.models import (
    SystemConfig, RepurchaseAnomaly, Appointment,
    User, UserRole, ConfigType, AppointmentStatus
)
from app.schemas.schemas import (
    SystemConfigCreate, SystemConfigResponse,
    RepurchaseAnomalyResponse
)

router = APIRouter(tags=["config_analytics"])


@router.get("/configs", response_model=List[SystemConfigResponse])
async def list_configs(
    config_type: Optional[ConfigType] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    query = select(SystemConfig)
    if config_type:
        query = query.where(SystemConfig.config_type == config_type)
    if is_active is not None:
        query = query.where(SystemConfig.is_active == is_active)
    result = await db.execute(query.order_by(SystemConfig.priority.desc()))
    return result.scalars().all()


@router.post("/configs", response_model=SystemConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_config(
    config_in: SystemConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    today = date.today()
    is_active = True

    if config_in.valid_from and config_in.valid_from > today:
        is_active = False
    if config_in.valid_to and config_in.valid_to < today:
        is_active = False

    config = SystemConfig(
        **config_in.model_dump(),
        is_active=is_active,
        created_by=current_user.id,
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return config


@router.put("/configs/{config_id}", response_model=SystemConfigResponse)
async def update_config(
    config_id: int,
    config_in: SystemConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    result = await db.execute(select(SystemConfig).where(SystemConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    update_data = config_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    today = date.today()
    if config.valid_from and config.valid_from > today:
        config.is_active = False
    elif config.valid_to and config.valid_to < today:
        config.is_active = False
    else:
        config.is_active = True

    await db.commit()
    await db.refresh(config)
    return config


@router.patch("/configs/{config_id}/toggle")
async def toggle_config(
    config_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    result = await db.execute(select(SystemConfig).where(SystemConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    config.is_active = not config.is_active
    await db.commit()
    return {"message": f"Config {'activated' if config.is_active else 'deactivated'} successfully"}


@router.get("/configs/boarding-rules")
async def get_boarding_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SystemConfig).where(
            and_(
                SystemConfig.config_type == ConfigType.BOARDING_CAGE,
                SystemConfig.is_active == True,
            )
        ).order_by(SystemConfig.priority.desc())
    )
    configs = result.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "config_value": c.config_value,
            "conditions": c.conditions,
            "priority": c.priority,
        }
        for c in configs
    ]


@router.get("/configs/health-rules")
async def get_health_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SystemConfig).where(
            and_(
                SystemConfig.config_type == ConfigType.HEALTH_CHANGE,
                SystemConfig.is_active == True,
            )
        ).order_by(SystemConfig.priority.desc())
    )
    configs = result.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "config_value": c.config_value,
            "conditions": c.conditions,
            "priority": c.priority,
        }
        for c in configs
    ]


@router.get("/configs/vaccine-allergy-rules")
async def get_vaccine_allergy_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SystemConfig).where(
            and_(
                SystemConfig.config_type == ConfigType.VACCINE_ALLERGY,
                SystemConfig.is_active == True,
            )
        ).order_by(SystemConfig.priority.desc())
    )
    configs = result.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "config_value": c.config_value,
            "conditions": c.conditions,
            "priority": c.priority,
        }
        for c in configs
    ]


@router.get("/repurchase-anomalies", response_model=List[RepurchaseAnomalyResponse])
async def list_repurchase_anomalies(
    is_resolved: Optional[bool] = None,
    customer_id: Optional[int] = None,
    exclude_test: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    query = select(RepurchaseAnomaly)
    if is_resolved is not None:
        query = query.where(RepurchaseAnomaly.is_resolved == is_resolved)
    if customer_id:
        query = query.where(RepurchaseAnomaly.customer_id == customer_id)
    if exclude_test and not is_test_user(current_user):
        query = query.where(RepurchaseAnomaly.is_test_data == False)

    result = await db.execute(query.order_by(RepurchaseAnomaly.created_at.desc()))
    return result.scalars().all()


@router.post("/repurchase-anomalies/{anomaly_id}/resolve")
async def resolve_anomaly(
    anomaly_id: int,
    resolution_notes: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    result = await db.execute(select(RepurchaseAnomaly).where(RepurchaseAnomaly.id == anomaly_id))
    anomaly = result.scalar_one_or_none()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    anomaly.is_resolved = True
    anomaly.resolution_notes = resolution_notes
    await db.commit()
    return {"message": "Anomaly resolved successfully"}


@router.post("/repurchase-anomalies/scan")
async def scan_repurchase_anomalies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    config_result = await db.execute(
        select(SystemConfig).where(
            and_(
                SystemConfig.config_type == ConfigType.REPURCHASE_RULE,
                SystemConfig.is_active == True,
            )
        )
    )
    configs = config_result.scalars().all()

    rules = [c.config_value for c in configs]
    if not rules:
        rules = [
            {"min_days": 0, "max_days": 1, "anomaly_type": "too_frequent", "description": "复购间隔过短（24小时内重复预约）"},
            {"min_days": 90, "max_days": 99999, "anomaly_type": "too_infrequent", "description": "复购间隔过长（超过90天未复购）"},
        ]

    anomalies_found = []

    appointments_result = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.status == AppointmentStatus.COMPLETED,
                Appointment.is_test_data == False,
            )
        ).order_by(Appointment.customer_id, Appointment.appointment_date)
    )
    appointments = appointments_result.scalars().all()

    customer_appointments: Dict[int, List[Appointment]] = {}
    for appt in appointments:
        if appt.customer_id not in customer_appointments:
            customer_appointments[appt.customer_id] = []
        customer_appointments[appt.customer_id].append(appt)

    for customer_id, appts in customer_appointments.items():
        for i in range(1, len(appts)):
            prev_appt = appts[i - 1]
            curr_appt = appts[i]
            gap_days = (curr_appt.appointment_date - prev_appt.appointment_date).days

            for rule in rules:
                if rule["min_days"] <= gap_days <= rule["max_days"]:
                    existing = await db.execute(
                        select(RepurchaseAnomaly).where(
                            and_(
                                RepurchaseAnomaly.appointment_id == curr_appt.id,
                                RepurchaseAnomaly.rule_triggered == rule["anomaly_type"],
                            )
                        )
                    )
                    if not existing.scalar_one_or_none():
                        anomaly = RepurchaseAnomaly(
                            appointment_id=curr_appt.id,
                            customer_id=customer_id,
                            anomaly_type=rule["anomaly_type"],
                            description=rule["description"],
                            rule_triggered=rule["anomaly_type"],
                            previous_appointment_id=prev_appt.id,
                            gap_days=gap_days,
                            is_test_data=False,
                        )
                        db.add(anomaly)
                        anomalies_found.append({
                            "customer_id": customer_id,
                            "appointment_id": curr_appt.id,
                            "gap_days": gap_days,
                            "anomaly_type": rule["anomaly_type"],
                        })

    await db.commit()
    return {"message": "Scan completed", "anomalies_found": len(anomalies_found), "details": anomalies_found}


@router.get("/analytics/overview")
async def get_analytics_overview(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    store_id: Optional[int] = None,
    exclude_test: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    result = {}

    appt_query = select(
        func.count(Appointment.id).label("total"),
        func.sum(case((Appointment.status == AppointmentStatus.COMPLETED, 1), else_=0)).label("completed"),
        func.sum(case((Appointment.status == AppointmentStatus.CANCELLED, 1), else_=0)).label("cancelled"),
        func.sum(case((Appointment.status == AppointmentStatus.NO_SHOW, 1), else_=0)).label("no_show"),
        func.coalesce(func.sum(Appointment.total_price), 0).label("revenue"),
    )

    if exclude_test and not is_test_user(current_user):
        appt_query = appt_query.where(Appointment.is_test_data == False)
    if store_id:
        appt_query = appt_query.where(Appointment.store_id == store_id)
    if date_from:
        appt_query = appt_query.where(Appointment.appointment_date >= datetime.strptime(date_from, "%Y-%m-%d").date())
    if date_to:
        appt_query = appt_query.where(Appointment.appointment_date <= datetime.strptime(date_to, "%Y-%m-%d").date())

    appt_result = await db.execute(appt_query)
    appt_stats = appt_result.one()
    result["appointments"] = {
        "total": appt_stats.total,
        "completed": appt_stats.completed,
        "cancelled": appt_stats.cancelled,
        "no_show": appt_stats.no_show,
        "revenue": float(appt_stats.revenue),
    }

    anomaly_query = select(
        func.count(RepurchaseAnomaly.id).label("total"),
        func.sum(case((RepurchaseAnomaly.is_resolved == False, 1), else_=0)).label("unresolved"),
    )
    if exclude_test and not is_test_user(current_user):
        anomaly_query = anomaly_query.where(RepurchaseAnomaly.is_test_data == False)
    anomaly_result = await db.execute(anomaly_query)
    anomaly_stats = anomaly_result.one()
    result["repurchase_anomalies"] = {
        "total": anomaly_stats.total,
        "unresolved": anomaly_stats.unresolved,
    }

    return result
