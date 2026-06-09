from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.risk_score import RiskScore
from app.models.sms import SmsTemplate, SmsRecord
from app.models.callback import CallbackRecord
from app.models.appointment import Appointment
from app.schemas.business import (
    SmsSendRequest, SmsSendResponse, CallbackListGenerateRequest
)


class SmsStrategyService:
    RISK_LEVEL_PRIORITY = {"low": 1, "medium": 2, "high": 3, "critical": 4}

    DEFAULT_TEMPLATES = [
        {"name": "低风险标准提醒", "code": "SMS_LOW_001", "risk_level_min": "low",
         "content": "尊敬的患者，您预约的{department}门诊将于{date} {time}开始，请准时到院。"},
        {"name": "中风险加强提醒", "code": "SMS_MEDIUM_001", "risk_level_min": "medium",
         "content": "温馨提醒：您预约的{department} {doctor}门诊将于{date} {time}开始，如无法就诊请及时取消，感谢配合。"},
        {"name": "高风险重点提醒", "code": "SMS_HIGH_001", "risk_level_min": "high",
         "content": "重要提醒：您预约的{department} {doctor}门诊将于{date} {time}开始，如行程有变请提前取消，避免影响后续预约。如需帮助请回复。"},
    ]

    @staticmethod
    def init_default_templates(db: Session) -> None:
        for tpl in SmsStrategyService.DEFAULT_TEMPLATES:
            existing = db.query(SmsTemplate).filter(SmsTemplate.code == tpl["code"]).first()
            if not existing:
                db.add(SmsTemplate(**tpl))
        db.commit()

    @staticmethod
    def list_templates(db: Session, is_active: Optional[bool] = None) -> List[SmsTemplate]:
        query = db.query(SmsTemplate)
        if is_active is not None:
            query = query.filter(SmsTemplate.is_active == is_active)
        return query.order_by(SmsTemplate.code).all()

    @staticmethod
    def create_template(db: Session, data) -> SmsTemplate:
        tpl = SmsTemplate(**data.model_dump())
        db.add(tpl)
        db.commit()
        db.refresh(tpl)
        return tpl

    @staticmethod
    def _select_template(db: Session, risk_level: str, template_id: Optional[int] = None) -> Optional[SmsTemplate]:
        if template_id:
            return db.query(SmsTemplate).filter(SmsTemplate.id == template_id, SmsTemplate.is_active == True).first()

        risk_priority = SmsStrategyService.RISK_LEVEL_PRIORITY.get(risk_level, 1)
        templates = db.query(SmsTemplate).filter(SmsTemplate.is_active == True).all()
        suitable = []
        for t in templates:
            tpl_priority = SmsStrategyService.RISK_LEVEL_PRIORITY.get(t.risk_level_min, 1)
            if tpl_priority <= risk_priority:
                suitable.append((tpl_priority, t))
        if not suitable:
            return templates[0] if templates else None
        suitable.sort(key=lambda x: x[0], reverse=True)
        return suitable[0][1]

    @staticmethod
    def _render_content(template: SmsTemplate, appointment: Optional[Appointment]) -> str:
        content = template.content
        if appointment:
            dept_name = appointment.department.name if appointment.department else "门诊"
            doc_name = appointment.doctor_name or "指定医生"
            date_str = str(appointment.appointment_date) if appointment.appointment_date else ""
            time_str = str(appointment.appointment_time) if appointment.appointment_time else ""
            content = content.format(
                department=dept_name, doctor=doc_name,
                date=date_str, time=time_str,
                patient_id=appointment.appointment_no
            )
        return content

    @staticmethod
    def send_sms(db: Session, request: SmsSendRequest) -> SmsSendResponse:
        success = 0
        failed = 0

        for rs_id in request.risk_score_ids:
            try:
                rs = db.query(RiskScore).filter(RiskScore.id == rs_id).first()
                if not rs:
                    failed += 1
                    continue

                template = SmsStrategyService._select_template(db, rs.risk_level, request.template_id)
                if not template:
                    failed += 1
                    continue

                content = SmsStrategyService._render_content(template, rs.appointment)

                record = SmsRecord(
                    risk_score_id=rs.id,
                    template_id=template.id,
                    content=content,
                    send_status="sent",
                    send_time=datetime.utcnow(),
                    delivered=True,
                    delivery_time=datetime.utcnow(),
                )
                db.add(record)
                success += 1
            except Exception:
                failed += 1

        db.commit()
        return SmsSendResponse(total_count=len(request.risk_score_ids), success_count=success, failed_count=failed)

    @staticmethod
    def auto_send_strategy(db: Session, batch_id: Optional[str] = None) -> Dict[str, int]:
        query = db.query(RiskScore)
        if batch_id:
            query = query.filter(RiskScore.batch_id == batch_id)
        scores = query.filter(~RiskScore.smss.any()).all()

        sent = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for rs in scores:
            try:
                template = SmsStrategyService._select_template(db, rs.risk_level)
                if not template:
                    continue
                content = SmsStrategyService._render_content(template, rs.appointment)
                record = SmsRecord(
                    risk_score_id=rs.id, template_id=template.id,
                    content=content, send_status="sent",
                    send_time=datetime.utcnow(), delivered=True,
                    delivery_time=datetime.utcnow(),
                )
                db.add(record)
                sent[rs.risk_level] = sent.get(rs.risk_level, 0) + 1
            except Exception:
                continue
        db.commit()
        return sent


class CallbackService:
    @staticmethod
    def generate_callback_list(
        db: Session, request: CallbackListGenerateRequest
    ) -> List[Dict[str, Any]]:
        from sqlalchemy import and_
        level_priority = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        min_priority = level_priority.get(request.min_risk_level, 3)

        query = (
            db.query(RiskScore)
            .join(Appointment)
            .filter(~RiskScore.callbacks.any())
        )

        conditions = []
        eligible_levels = [lvl for lvl, prio in level_priority.items() if prio >= min_priority]
        conditions.append(RiskScore.risk_level.in_(eligible_levels))
        conditions.append(RiskScore.needs_callback == True)

        if request.department_id:
            conditions.append(Appointment.department_id == request.department_id)
        if request.date_from:
            conditions.append(Appointment.appointment_date >= request.date_from.date())
        if request.date_to:
            conditions.append(Appointment.appointment_date <= request.date_to.date())

        if conditions:
            query = query.filter(and_(*conditions))

        scores = query.order_by(RiskScore.risk_score.desc()).limit(request.max_count).all()

        callbacks = []
        for rs in scores:
            a = rs.appointment
            priority = "critical" if rs.risk_level == "critical" else rs.risk_level
            cb = CallbackRecord(
                risk_score_id=rs.id,
                assigned_to=request.assigned_to if hasattr(request, 'assigned_to') else None,
                priority=priority,
                callback_status="pending",
            )
            db.add(cb)
            db.flush()
            callbacks.append({
                "callback_id": cb.id,
                "risk_score_id": rs.id,
                "appointment_no": a.appointment_no if a else "",
                "patient_age": a.patient_age if a else None,
                "patient_gender": a.patient_gender if a else None,
                "department_name": a.department.name if a and a.department else "",
                "doctor_name": a.doctor_name if a else "",
                "appointment_date": str(a.appointment_date) if a and a.appointment_date else "",
                "appointment_time": str(a.appointment_time) if a and a.appointment_time else "",
                "risk_score": rs.risk_score,
                "risk_level": rs.risk_level,
                "priority": priority,
                "recommendation": rs.recommendation,
                "top_features": rs.top_features,
                "assigned_to": cb.assigned_to,
                "status": cb.callback_status,
                "created_at": cb.created_at.isoformat() if cb.created_at else None,
            })
        db.commit()
        return callbacks

    @staticmethod
    def list_callbacks(
        db: Session,
        skip: int = 0, limit: int = 100,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        query = db.query(CallbackRecord)
        if status:
            query = query.filter(CallbackRecord.callback_status == status)
        if priority:
            query = query.filter(CallbackRecord.priority == priority)
        if assigned_to:
            query = query.filter(CallbackRecord.assigned_to == assigned_to)

        callbacks = query.order_by(CallbackRecord.priority.desc(), CallbackRecord.created_at.desc()).offset(skip).limit(limit).all()

        result = []
        for cb in callbacks:
            rs = cb.risk_score
            a = rs.appointment if rs else None
            result.append({
                "id": cb.id,
                "risk_score_id": cb.risk_score_id,
                "priority": cb.priority,
                "callback_status": cb.callback_status,
                "callback_result": cb.callback_result,
                "patient_response": cb.patient_response,
                "notes": cb.notes,
                "callback_time": cb.callback_time.isoformat() if cb.callback_time else None,
                "completed_at": cb.completed_at.isoformat() if cb.completed_at else None,
                "assigned_to_name": cb.assignee.full_name if cb.assignee else None,
                "appointment_no": a.appointment_no if a else "",
                "patient_age": a.patient_age if a else None,
                "patient_gender": a.patient_gender if a else None,
                "department_name": a.department.name if a and a.department else "",
                "doctor_name": a.doctor_name if a else "",
                "appointment_date": str(a.appointment_date) if a and a.appointment_date else "",
                "appointment_time": str(a.appointment_time) if a and a.appointment_time else "",
                "risk_score": rs.risk_score if rs else None,
                "risk_level": rs.risk_level if rs else None,
                "recommendation": rs.recommendation if rs else None,
                "top_features": rs.top_features if rs else None,
                "created_at": cb.created_at.isoformat() if cb.created_at else None,
            })
        return result

    @staticmethod
    def update_callback(db: Session, callback_id: int, data) -> Optional[CallbackRecord]:
        cb = db.query(CallbackRecord).filter(CallbackRecord.id == callback_id).first()
        if not cb:
            return None
        update_data = data.model_dump(exclude_unset=True)
        if "callback_status" in update_data and update_data["callback_status"] == "completed":
            cb.completed_at = datetime.utcnow()
            if "callback_time" not in update_data:
                cb.callback_time = datetime.utcnow()
        for field, value in update_data.items():
            setattr(cb, field, value)
        db.commit()
        db.refresh(cb)
        return cb
