import pandas as pd
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.models.department import Department
from app.models.time_slot import TimeSlot
from app.models.model_version import ModelVersion
from app.models.risk_score import RiskScore
from app.ml.feature_engineer import FeatureEngineer
from app.ml.inference_service import inference_service
from app.ml.lgb_trainer import LightGBMTrainer
from app.schemas.model import ScoringResponse, ModelTrainRequest, ModelTrainResponse, ModelMetrics


class ScoringService:
    @staticmethod
    def _load_appointments_dataframe(
        db: Session, appointment_ids: Optional[List[int]] = None,
        date_from: Optional[date] = None, date_to: Optional[date] = None,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        query = db.query(Appointment)
        if appointment_ids:
            query = query.filter(Appointment.id.in_(appointment_ids))
        if date_from:
            query = query.filter(Appointment.appointment_date >= date_from)
        if date_to:
            query = query.filter(Appointment.appointment_date <= date_to)

        appts = query.all()
        if not appts:
            return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

        data = []
        for a in appts:
            data.append({
                "id": a.id,
                "appointment_no": a.appointment_no,
                "patient_age": a.patient_age,
                "patient_gender": a.patient_gender,
                "department_id": a.department_id,
                "doctor_name": a.doctor_name,
                "appointment_date": a.appointment_date.isoformat() if a.appointment_date else None,
                "appointment_time": a.appointment_time.isoformat() if a.appointment_time else None,
                "appointment_type": a.appointment_type,
                "is_revisit": a.is_revisit,
                "channel": a.channel,
                "reminder_method": a.reminder_method,
                "days_in_advance": a.days_in_advance,
                "historical_no_show_count": a.historical_no_show_count,
                "historical_total_count": a.historical_total_count,
                "distance_km": a.distance_km,
                "weather_condition": a.weather_condition,
                "is_holiday": a.is_holiday,
                "actual_status": a.actual_status,
            })
        appts_df = pd.DataFrame(data)

        depts = db.query(Department).all()
        depts_df = pd.DataFrame([{
            "id": d.id, "code": d.code, "name": d.name,
            "default_no_show_rate": d.default_no_show_rate,
        } for d in depts])

        slots = db.query(TimeSlot).all()
        slots_df = pd.DataFrame([{
            "id": s.id, "department_id": s.department_id,
            "day_of_week": s.day_of_week, "start_time": str(s.start_time),
            "end_time": str(s.end_time), "capacity": s.capacity,
            "historical_no_show_count": s.historical_no_show_count,
            "historical_total_count": s.historical_total_count,
        } for s in slots])

        return appts_df, depts_df, slots_df

    @staticmethod
    def run_scoring(
        db: Session,
        appointment_ids: Optional[List[int]] = None,
        model_version_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> ScoringResponse:
        batch_id = f"score_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"

        version_query = db.query(ModelVersion)
        if model_version_id:
            mv = version_query.filter(ModelVersion.id == model_version_id).first()
        else:
            mv = version_query.filter(ModelVersion.is_active == True).first()

        if not mv:
            all_mv = version_query.order_by(ModelVersion.created_at.desc()).first()
            if all_mv:
                mv = all_mv
                mv.is_active = True
                db.commit()

        if not mv:
            return ScoringResponse(
                total_count=0, success_count=0, failed_count=0,
                batch_id=batch_id, risk_distribution={}
            )

        if not inference_service.set_active_version(mv.version):
            return ScoringResponse(
                total_count=0, success_count=0, failed_count=0,
                batch_id=batch_id, risk_distribution={}
            )

        appts_df, depts_df, slots_df = ScoringService._load_appointments_dataframe(
            db, appointment_ids, date_from, date_to
        )

        if appts_df.empty:
            return ScoringResponse(
                total_count=0, success_count=0, failed_count=0,
                batch_id=batch_id, risk_distribution={}
            )

        features_df = FeatureEngineer.build_features(appts_df, depts_df, slots_df)
        results = inference_service.predict_batch(features_df, explain=False)

        id_to_appt = dict(zip(features_df["appointment_id"].tolist(), range(len(features_df))))
        success = 0
        failed = 0
        risk_distribution: Dict[str, int] = {"low": 0, "medium": 0, "high": 0, "critical": 0}

        for result in results:
            try:
                appt_id = int(result["appointment_id"])
                features_idx = id_to_appt.get(appt_id)
                top_features = None
                if features_idx is not None and features_idx < 50:
                    single_feats = features_df.iloc[[features_idx]]
                    single_result = inference_service.predict_single(
                        {col: single_feats.iloc[0][col] for col in single_feats.columns if col != "appointment_id"},
                        explain=True,
                    )
                    if single_result:
                        top_features = single_result.get("top_features")

                needs_callback = result["risk_level"] in ["high", "critical"]

                sms_template_map = {"low": 1, "medium": 2, "high": 3, "critical": 3}

                rs = RiskScore(
                    appointment_id=appt_id,
                    model_version_id=mv.id,
                    risk_score=result["risk_score"],
                    risk_level=result["risk_level"],
                    risk_threshold=result["risk_threshold"],
                    top_features=top_features,
                    recommendation=result["recommendation"],
                    sms_template_id=sms_template_map.get(result["risk_level"], 1),
                    needs_callback=needs_callback,
                    batch_id=batch_id,
                    scoring_time_ms=result.get("scoring_time_ms"),
                )
                db.add(rs)
                risk_distribution[result["risk_level"]] = risk_distribution.get(result["risk_level"], 0) + 1
                success += 1

                if success % 100 == 0:
                    db.commit()
            except Exception as e:
                failed += 1
                print(f"Scoring error for appointment {result.get('appointment_id')}: {e}")

        db.commit()
        return ScoringResponse(
            total_count=len(results),
            success_count=success,
            failed_count=failed,
            batch_id=batch_id,
            risk_distribution=risk_distribution,
        )

    @staticmethod
    def get_risk_scores(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        risk_level: Optional[str] = None,
        department_id: Optional[int] = None,
        batch_id: Optional[str] = None,
        model_version_id: Optional[int] = None,
        needs_callback: Optional[bool] = None,
    ) -> List[Dict[str, Any]]:
        from sqlalchemy import and_
        query = db.query(RiskScore).join(Appointment)
        conditions = []
        if risk_level:
            conditions.append(RiskScore.risk_level == risk_level)
        if department_id:
            conditions.append(Appointment.department_id == department_id)
        if batch_id:
            conditions.append(RiskScore.batch_id == batch_id)
        if model_version_id:
            conditions.append(RiskScore.model_version_id == model_version_id)
        if needs_callback is not None:
            conditions.append(RiskScore.needs_callback == needs_callback)
        if conditions:
            query = query.filter(and_(*conditions))

        scores = query.order_by(RiskScore.risk_score.desc()).offset(skip).limit(limit).all()

        result = []
        for s in scores:
            a = s.appointment
            item = {
                "id": s.id,
                "appointment_id": s.appointment_id,
                "appointment_no": a.appointment_no if a else "",
                "patient_age": a.patient_age if a else None,
                "patient_gender": a.patient_gender if a else None,
                "department_name": a.department.name if a and a.department else "",
                "doctor_name": a.doctor_name if a else "",
                "appointment_date": a.appointment_date.isoformat() if a and a.appointment_date else None,
                "appointment_time": a.appointment_time.isoformat() if a and a.appointment_time else None,
                "appointment_type": a.appointment_type if a else "",
                "actual_status": a.actual_status if a else "",
                "risk_score": s.risk_score,
                "risk_level": s.risk_level,
                "risk_threshold": s.risk_threshold,
                "top_features": s.top_features,
                "recommendation": s.recommendation,
                "sms_template_id": s.sms_template_id,
                "needs_callback": s.needs_callback,
                "is_override": s.is_override,
                "override_reason": s.override_reason,
                "model_version": s.model_version.version if s.model_version else "",
                "batch_id": s.batch_id,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            result.append(item)
        return result

    @staticmethod
    def get_score_detail(db: Session, score_id: int) -> Optional[Dict[str, Any]]:
        s = db.query(RiskScore).filter(RiskScore.id == score_id).first()
        if not s:
            return None

        a = s.appointment
        features_dict = {}
        if a:
            features_dict = {
                "patient_age": a.patient_age,
                "patient_gender": a.patient_gender,
                "appointment_type": a.appointment_type,
                "is_revisit": a.is_revisit,
                "channel": a.channel,
                "reminder_method": a.reminder_method,
                "days_in_advance": a.days_in_advance,
                "historical_no_show_rate": (
                    f"{a.historical_no_show_count / a.historical_total_count * 100:.1f}%"
                    if a.historical_total_count > 0 else "无历史数据"
                ),
                "distance_km": a.distance_km,
                "weather_condition": a.weather_condition,
                "is_holiday": a.is_holiday,
                "department": a.department.name if a.department else "",
                "appointment_date": str(a.appointment_date),
                "appointment_time": str(a.appointment_time),
            }

        return {
            "id": s.id,
            "appointment": {
                "id": a.id, "appointment_no": a.appointment_no,
                "patient_age": a.patient_age, "patient_gender": a.patient_gender,
                "doctor_name": a.doctor_name, "appointment_type": a.appointment_type,
                "actual_status": a.actual_status, "remark": a.remark,
            } if a else None,
            "features": features_dict,
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "risk_threshold": s.risk_threshold,
            "top_features": s.top_features or [],
            "recommendation": s.recommendation,
            "needs_callback": s.needs_callback,
            "is_override": s.is_override,
            "override_reason": s.override_reason,
            "model_version": s.model_version.version if s.model_version else "",
            "model_name": s.model_version.model_name if s.model_version else "LightGBM",
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }

    @staticmethod
    def override_score(
        db: Session, score_id: int, new_level: str, new_score: Optional[float] = None,
        reason: str = "", operator_id: Optional[int] = None,
    ) -> Optional[RiskScore]:
        s = db.query(RiskScore).filter(RiskScore.id == score_id).first()
        if not s:
            return None
        s.is_override = True
        s.risk_level = new_level
        if new_score is not None:
            s.risk_score = new_score
        s.override_reason = reason
        s.needs_callback = new_level in ["high", "critical"]
        db.commit()
        db.refresh(s)
        return s
