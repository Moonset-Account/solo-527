from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import get_current_user
from app.services import MonitorAlertService, YieldPredictionService, DataScopeService
from app.deps import make_payload_dep

router = APIRouter()


def _paginate(query, page: int, page_size: int):
    total = query.count()
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    pagination = schemas.Pagination(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )
    return items, pagination


@router.post("/readings", response_model=schemas.EnvReadingOut, status_code=status.HTTP_201_CREATED)
def create_reading(
    payload: schemas.EnvReadingCreate = make_payload_dep(schemas.EnvReadingCreate),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.query(models.Plot).filter(models.Plot.id == payload.plot_id).first():
        raise HTTPException(status_code=404, detail=f"地块 {payload.plot_id} 不存在")
    if not db.query(models.Variety).filter(models.Variety.id == payload.variety_id).first():
        raise HTTPException(status_code=404, detail=f"品种 {payload.variety_id} 不存在")

    data = payload.model_dump()
    reading_time_str = data.pop("reading_time", None)
    if reading_time_str:
        try:
            reading_time = datetime.fromisoformat(reading_time_str.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="reading_time 格式无效")
    else:
        reading_time = datetime.utcnow()

    reading = models.EnvReading(
        **data,
        reading_time=reading_time,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(reading)
    db.flush()

    metrics_dict = {}
    for field in ["temperature_c", "humidity_pct", "soil_moisture_pct",
                  "ph_value", "light_lux", "wind_speed_ms", "rainfall_mm"]:
        val = getattr(reading, field, None)
        if val is not None:
            metrics_dict[field] = val

    MonitorAlertService.check_thresholds(
        db=db,
        plot_id=reading.plot_id,
        variety_id=reading.variety_id,
        metrics_dict=metrics_dict,
        creator_id=current_user.id,
    )

    db.commit()
    db.refresh(reading)
    return reading


@router.get("/thresholds", response_model=schemas.PaginatedResponse[schemas.ThresholdOut])
def list_thresholds(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    variety_id: Optional[int] = Query(None),
    metric: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.Threshold).order_by(models.Threshold.id.desc())
    )
    if variety_id is not None:
        query = query.filter(models.Threshold.variety_id == variety_id)
    if metric is not None:
        query = query.filter(models.Threshold.metric == metric)
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/thresholds", response_model=schemas.ThresholdOut, status_code=status.HTTP_201_CREATED)
def create_threshold(
    payload: schemas.ThresholdCreate = make_payload_dep(schemas.ThresholdCreate),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.query(models.Variety).filter(models.Variety.id == payload.variety_id).first():
        raise HTTPException(status_code=404, detail=f"品种 {payload.variety_id} 不存在")

    existing = db.query(models.Threshold).filter(
        models.Threshold.variety_id == payload.variety_id,
        models.Threshold.metric == payload.metric,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"品种 {payload.variety_id} 的指标 {payload.metric} 阈值已存在")

    try:
        alert_level = models.AlertLevel(payload.alert_level)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"无效的告警级别: {payload.alert_level}")

    threshold = models.Threshold(
        variety_id=payload.variety_id,
        metric=payload.metric,
        min_value=payload.min_value,
        max_value=payload.max_value,
        alert_level=alert_level,
        is_active=payload.is_active,
        description=payload.description,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(threshold)
    db.commit()
    db.refresh(threshold)
    return threshold


@router.put("/thresholds/{threshold_id}", response_model=schemas.ThresholdOut)
def update_threshold(
    threshold_id: int,
    payload: schemas.ThresholdUpdate = make_payload_dep(schemas.ThresholdUpdate),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    threshold = db.query(models.Threshold).filter(models.Threshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="阈值不存在")

    update_data = payload.model_dump(exclude_unset=True)

    if "alert_level" in update_data:
        try:
            update_data["alert_level"] = models.AlertLevel(update_data["alert_level"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"无效的告警级别: {update_data['alert_level']}")

    for key, value in update_data.items():
        setattr(threshold, key, value)

    threshold.updated_by = current_user.id
    db.commit()
    db.refresh(threshold)
    return threshold


@router.get("/alerts", response_model=schemas.PaginatedResponse[schemas.AlertOut])
def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    plot_id: Optional[int] = Query(None),
    variety_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.Alert).order_by(models.Alert.id.desc())
    )
    if plot_id is not None:
        query = query.filter(models.Alert.plot_id == plot_id)
    if variety_id is not None:
        query = query.filter(models.Alert.variety_id == variety_id)
    if status_filter is not None:
        query = query.filter(models.Alert.status == status_filter)
    if level is not None:
        query = query.filter(models.Alert.level == level)
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.get("/alerts/{alert_id}", response_model=schemas.AlertOut)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="告警不存在")
    return alert


@router.post("/alerts/{alert_id}/ack", response_model=schemas.AlertOut)
def ack_alert(
    alert_id: int,
    payload: schemas.AlertAck = make_payload_dep(schemas.AlertAck),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    alert = MonitorAlertService.acknowledge_alert(db, alert_id, current_user.id, payload.notes)
    if not alert:
        raise HTTPException(status_code=404, detail="告警不存在")
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/alerts/{alert_id}/resolve", response_model=schemas.AlertOut)
def resolve_alert(
    alert_id: int,
    payload: schemas.AlertResolve = make_payload_dep(schemas.AlertResolve),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    alert = MonitorAlertService.resolve_alert(db, alert_id, current_user.id, payload.resolution_notes)
    if not alert:
        raise HTTPException(status_code=404, detail="告警不存在")
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/predictions", response_model=schemas.PaginatedResponse[schemas.YieldPredictionOut])
def list_predictions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    harvest_id: Optional[int] = Query(None),
    plot_id: Optional[int] = Query(None),
    variety_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.YieldPrediction).order_by(models.YieldPrediction.id.desc())
    )
    if harvest_id is not None:
        query = query.filter(models.YieldPrediction.harvest_id == harvest_id)
    if plot_id is not None:
        query = query.filter(models.YieldPrediction.plot_id == plot_id)
    if variety_id is not None:
        query = query.filter(models.YieldPrediction.variety_id == variety_id)
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/predictions/{prediction_id}/send-reminder", response_model=schemas.YieldPredictionOut)
def send_prediction_reminder(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    prediction = db.query(models.YieldPrediction).filter(models.YieldPrediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="产量预测不存在")

    YieldPredictionService.send_reminder(db=db, prediction=prediction)
    db.commit()
    db.refresh(prediction)
    return prediction
