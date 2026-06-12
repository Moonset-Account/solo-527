from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app import models


class HarvestChainService:
    @staticmethod
    def create_harvest(db: Session, harvest: models.HarvestRecord, current_user_id: int) -> None:
        HarvestChainService._trigger_alerts_for_harvest(db, harvest)
        HarvestChainService._trigger_prediction_for_harvest(db, harvest, current_user_id)

    @staticmethod
    def create_batch(db: Session, batch: models.HarvestBatch, current_user_id: int) -> None:
        pass

    @staticmethod
    def _trigger_alerts_for_harvest(db: Session, harvest: models.HarvestRecord) -> None:
        thresholds = db.query(models.Threshold).filter(
            models.Threshold.variety_id == harvest.variety_id,
            models.Threshold.is_active == True,
        ).all()

        for threshold in thresholds:
            actual_value = None
            if threshold.metric == "temperature_c" and harvest.temperature_c is not None:
                actual_value = harvest.temperature_c
            elif threshold.metric == "humidity_pct" and harvest.humidity_pct is not None:
                actual_value = harvest.humidity_pct

            if actual_value is None:
                continue

            out_of_range = False
            if threshold.min_value is not None and actual_value < threshold.min_value:
                out_of_range = True
            if threshold.max_value is not None and actual_value > threshold.max_value:
                out_of_range = True

            if out_of_range:
                alert = models.Alert(
                    harvest_id=harvest.id,
                    plot_id=harvest.plot_id,
                    variety_id=harvest.variety_id,
                    level=threshold.alert_level,
                    status=models.AlertStatus.OPEN,
                    metric=threshold.metric,
                    actual_value=actual_value,
                    threshold_min=threshold.min_value,
                    threshold_max=threshold.max_value,
                    message=f"{threshold.metric} 超出阈值范围: 当前值 {actual_value}, 阈值范围 [{threshold.min_value}, {threshold.max_value}]",
                    triggered_at=datetime.utcnow(),
                    created_by=harvest.created_by,
                    updated_by=harvest.created_by,
                )
                db.add(alert)
        db.commit()

    @staticmethod
    def _trigger_prediction_for_harvest(db: Session, harvest: models.HarvestRecord, current_user_id: int) -> None:
        variety = db.query(models.Variety).filter(models.Variety.id == harvest.variety_id).first()
        predicted_yield = variety.expected_yield_kg if variety and variety.expected_yield_kg else 0.0
        confidence = 0.75

        prediction = models.YieldPrediction(
            harvest_id=harvest.id,
            plot_id=harvest.plot_id,
            variety_id=harvest.variety_id,
            prediction_date=harvest.harvest_date,
            predicted_yield_kg=predicted_yield,
            confidence_pct=confidence * 100,
            model_version="v1.0",
            is_reminder_sent=False,
            created_by=current_user_id,
            updated_by=current_user_id,
        )
        db.add(prediction)

        harvest.predicted_yield_kg = predicted_yield
        if harvest.actual_yield_kg is not None and predicted_yield > 0:
            harvest.yield_deviation_pct = ((harvest.actual_yield_kg - predicted_yield) / predicted_yield) * 100

        db.commit()
