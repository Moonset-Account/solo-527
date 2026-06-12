from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app import models


class MonitorAlertService:
    @staticmethod
    def check_thresholds(db: Session, reading: models.EnvReading, current_user_id: int) -> List[models.Alert]:
        thresholds = db.query(models.Threshold).filter(
            models.Threshold.variety_id == reading.variety_id,
            models.Threshold.is_active == True,
        ).all()

        created_alerts = []

        for threshold in thresholds:
            actual_value = None
            if threshold.metric == "temperature_c":
                actual_value = reading.temperature_c
            elif threshold.metric == "humidity_pct":
                actual_value = reading.humidity_pct
            elif threshold.metric == "soil_moisture_pct":
                actual_value = reading.soil_moisture_pct
            elif threshold.metric == "ph_value":
                actual_value = reading.ph_value
            elif threshold.metric == "light_lux":
                actual_value = reading.light_lux
            elif threshold.metric == "wind_speed_ms":
                actual_value = reading.wind_speed_ms
            elif threshold.metric == "rainfall_mm":
                actual_value = reading.rainfall_mm

            if actual_value is None:
                continue

            out_of_range = False
            if threshold.min_value is not None and actual_value < threshold.min_value:
                out_of_range = True
            if threshold.max_value is not None and actual_value > threshold.max_value:
                out_of_range = True

            if out_of_range:
                alert = models.Alert(
                    plot_id=reading.plot_id,
                    variety_id=reading.variety_id,
                    level=threshold.alert_level,
                    status=models.AlertStatus.OPEN,
                    metric=threshold.metric,
                    actual_value=actual_value,
                    threshold_min=threshold.min_value,
                    threshold_max=threshold.max_value,
                    message=f"{threshold.metric} 超出阈值范围: 当前值 {actual_value}, 阈值范围 [{threshold.min_value}, {threshold.max_value}]",
                    triggered_at=datetime.utcnow(),
                    created_by=current_user_id,
                    updated_by=current_user_id,
                )
                db.add(alert)
                created_alerts.append(alert)

        if created_alerts:
            db.commit()
            for alert in created_alerts:
                db.refresh(alert)

        return created_alerts
