from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/environment", tags=["环境数据"])


@router.get("/data", response_model=List[schemas.EnvironmentData])
def get_environment_data(
    plot_id: Optional[int] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    query = db.query(models.EnvironmentData)
    if plot_id:
        query = query.filter(models.EnvironmentData.plot_id == plot_id)
    if start_time:
        query = query.filter(models.EnvironmentData.record_time >= start_time)
    if end_time:
        query = query.filter(models.EnvironmentData.record_time <= end_time)
    return query.order_by(desc(models.EnvironmentData.record_time)).offset(skip).limit(limit).all()


@router.get("/data/latest")
def get_latest_environment_data(
    plot_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    if plot_id:
        data = (
            db.query(models.EnvironmentData)
            .filter(models.EnvironmentData.plot_id == plot_id)
            .order_by(desc(models.EnvironmentData.record_time))
            .first()
        )
        return data
    plots = db.query(models.Plot).filter(models.Plot.status == "active").all()
    result = []
    for plot in plots:
        data = (
            db.query(models.EnvironmentData)
            .filter(models.EnvironmentData.plot_id == plot.id)
            .order_by(desc(models.EnvironmentData.record_time))
            .first()
        )
        result.append({"plot": plot, "data": data})
    return result


@router.get("/data/trend")
def get_environment_trend(
    plot_id: int,
    metric: str = Query(default="temperature", description="temperature/humidity/soil_moisture/light_intensity/co2_concentration"),
    hours: int = 24,
    db: Session = Depends(get_db),
):
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    query = db.query(models.EnvironmentData).filter(
        models.EnvironmentData.plot_id == plot_id,
        models.EnvironmentData.record_time >= start_time,
        models.EnvironmentData.record_time <= end_time,
    ).order_by(models.EnvironmentData.record_time)
    data = query.all()

    metric_col = getattr(models.EnvironmentData, metric, None)
    if metric_col is None:
        raise HTTPException(status_code=400, detail="无效的指标")

    result = [
        {"time": d.record_time.isoformat(), "value": getattr(d, metric)}
        for d in data
        if getattr(d, metric) is not None
    ]
    return {"metric": metric, "plot_id": plot_id, "data": result}


@router.post("/data", response_model=schemas.EnvironmentData)
def create_environment_data(
    data: schemas.EnvironmentDataCreate, db: Session = Depends(get_db)
):
    db_data = models.EnvironmentData(**data.model_dump())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data


@router.get("/alerts", response_model=List[schemas.EnvironmentAlert])
def get_environment_alerts(
    plot_id: Optional[int] = None,
    alert_level: Optional[str] = None,
    is_handled: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.EnvironmentAlert)
    if plot_id:
        query = query.filter(models.EnvironmentAlert.plot_id == plot_id)
    if alert_level:
        query = query.filter(models.EnvironmentAlert.alert_level == alert_level)
    if is_handled is not None:
        query = query.filter(models.EnvironmentAlert.is_handled == is_handled)
    return query.order_by(desc(models.EnvironmentAlert.created_at)).offset(skip).limit(limit).all()


@router.post("/alerts", response_model=schemas.EnvironmentAlert)
def create_environment_alert(
    alert: schemas.EnvironmentAlertCreate, db: Session = Depends(get_db)
):
    db_alert = models.EnvironmentAlert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.put("/alerts/{alert_id}", response_model=schemas.EnvironmentAlert)
def handle_alert(
    alert_id: int, alert_update: schemas.EnvironmentAlertUpdate, db: Session = Depends(get_db)
):
    alert = db.query(models.EnvironmentAlert).filter(models.EnvironmentAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="提醒不存在")
    if alert_update.is_handled:
        alert.is_handled = True
        alert.handled_at = datetime.now()
        if alert_update.handled_by:
            alert.handled_by = alert_update.handled_by
    db.commit()
    db.refresh(alert)
    return alert
