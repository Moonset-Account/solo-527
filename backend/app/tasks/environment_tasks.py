from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from ..celery_app import celery_app
from ..database import SessionLocal
from .. import models


@celery_app.task(name="check_environment_alerts")
def check_environment_alerts():
    db: Session = SessionLocal()
    try:
        plots = db.query(models.Plot).filter(models.Plot.status == "active").all()
        for plot in plots:
            latest_data = (
                db.query(models.EnvironmentData)
                .filter(models.EnvironmentData.plot_id == plot.id)
                .order_by(models.EnvironmentData.record_time.desc())
                .first()
            )
            if not latest_data:
                continue

            active_batches = (
                db.query(models.Batch)
                .filter(
                    models.Batch.plot_id == plot.id,
                    models.Batch.status == "growing",
                )
                .all()
            )

            for batch in active_batches:
                variety = batch.variety
                if not variety:
                    continue

                alerts = []
                if latest_data.temperature is not None:
                    if variety.optimal_temp_min and latest_data.temperature < variety.optimal_temp_min:
                        alerts.append(
                            {
                                "alert_type": "temperature_low",
                                "metric": "temperature",
                                "current_value": latest_data.temperature,
                                "threshold_min": variety.optimal_temp_min,
                                "threshold_max": variety.optimal_temp_max,
                                "message": f"温度过低，当前 {latest_data.temperature}℃，最适 {variety.optimal_temp_min}-{variety.optimal_temp_max}℃",
                                "alert_level": "warning" if latest_data.temperature >= variety.optimal_temp_min - 5 else "danger",
                            }
                        )
                    if variety.optimal_temp_max and latest_data.temperature > variety.optimal_temp_max:
                        alerts.append(
                            {
                                "alert_type": "temperature_high",
                                "metric": "temperature",
                                "current_value": latest_data.temperature,
                                "threshold_min": variety.optimal_temp_min,
                                "threshold_max": variety.optimal_temp_max,
                                "message": f"温度过高，当前 {latest_data.temperature}℃，最适 {variety.optimal_temp_min}-{variety.optimal_temp_max}℃",
                                "alert_level": "warning" if latest_data.temperature <= variety.optimal_temp_max + 5 else "danger",
                            }
                        )

                if latest_data.humidity is not None:
                    if variety.optimal_humidity_min and latest_data.humidity < variety.optimal_humidity_min:
                        alerts.append(
                            {
                                "alert_type": "humidity_low",
                                "metric": "humidity",
                                "current_value": latest_data.humidity,
                                "threshold_min": variety.optimal_humidity_min,
                                "threshold_max": variety.optimal_humidity_max,
                                "message": f"湿度过低，当前 {latest_data.humidity}%，最适 {variety.optimal_humidity_min}-{variety.optimal_humidity_max}%",
                                "alert_level": "warning",
                            }
                        )
                    if variety.optimal_humidity_max and latest_data.humidity > variety.optimal_humidity_max:
                        alerts.append(
                            {
                                "alert_type": "humidity_high",
                                "metric": "humidity",
                                "current_value": latest_data.humidity,
                                "threshold_min": variety.optimal_humidity_min,
                                "threshold_max": variety.optimal_humidity_max,
                                "message": f"湿度过高，当前 {latest_data.humidity}%，最适 {variety.optimal_humidity_min}-{variety.optimal_humidity_max}%",
                                "alert_level": "warning",
                            }
                        )

                for alert_data in alerts:
                    existing = (
                        db.query(models.EnvironmentAlert)
                        .filter(
                            models.EnvironmentAlert.plot_id == plot.id,
                            models.EnvironmentAlert.alert_type == alert_data["alert_type"],
                            models.EnvironmentAlert.is_handled == False,
                            models.EnvironmentAlert.created_at >= datetime.now() - timedelta(hours=1),
                        )
                        .first()
                    )
                    if not existing:
                        db_alert = models.EnvironmentAlert(
                            plot_id=plot.id,
                            **alert_data,
                        )
                        db.add(db_alert)

        db.commit()
        return {"status": "success", "plots_checked": len(plots)}
    finally:
        db.close()


@celery_app.task(name="update_yield_predictions")
def update_yield_predictions():
    db: Session = SessionLocal()
    try:
        growing_batches = db.query(models.Batch).filter(models.Batch.status == "growing").all()
        for batch in growing_batches:
            if batch.variety and batch.planting_quantity and batch.variety.expected_yield:
                predicted = batch.planting_quantity * batch.variety.expected_yield * 0.85
                batch.predicted_yield = round(predicted, 2)
        db.commit()
        return {"status": "success", "batches_updated": len(growing_batches)}
    finally:
        db.close()


@celery_app.task(name="generate_daily_todos")
def generate_daily_todos():
    db: Session = SessionLocal()
    try:
        today = datetime.now().date()
        growing_batches = db.query(models.Batch).filter(models.Batch.status == "growing").all()

        for batch in growing_batches:
            if not batch.plant_date or not batch.variety:
                continue

            days_since_plant = (today - batch.plant_date).days
            growth_cycle = batch.variety.growth_cycle_days or 90
            growth_progress = days_since_plant / growth_cycle

            if growth_progress < 0.3:
                todo_title = f"[{batch.batch_no}] 幼苗期巡查"
                description = "检查幼苗生长状况，浇水、施肥"
            elif growth_progress < 0.7:
                todo_title = f"[{batch.batch_no}] 生长期管理"
                description = "整枝打杈、病虫害防治、环境监控"
            else:
                todo_title = f"[{batch.batch_no}] 采收期准备"
                description = "预估产量、准备采收工具、联系分拣"

            existing = (
                db.query(models.TodoItem)
                .filter(
                    models.TodoItem.title == todo_title,
                    models.TodoItem.related_type == "batch",
                    models.TodoItem.related_id == batch.id,
                    cast(models.TodoItem.created_at, Date) == today,
                )
                .first()
            )

            if not existing:
                todo = models.TodoItem(
                    title=todo_title,
                    description=description,
                    priority="medium",
                    category="daily_check",
                    related_type="batch",
                    related_id=batch.id,
                    due_time=datetime.now() + timedelta(hours=8),
                )
                db.add(todo)

        db.commit()
        return {"status": "success", "batches_processed": len(growing_batches)}
    finally:
        db.close()
