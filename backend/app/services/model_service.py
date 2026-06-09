import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.appointment import Appointment
from app.models.department import Department
from app.models.risk_score import RiskScore
from app.models.model_version import ModelVersion
from app.models.callback import CallbackRecord
from app.models.sms import SmsRecord
from app.models.feedback import ManualFeedback
from app.services.scoring_service import ScoringService
from app.ml.lgb_trainer import LightGBMTrainer
from app.ml.feature_engineer import FeatureEngineer
from app.ml.inference_service import inference_service
from app.models.user import User
from app.schemas.model import ModelTrainRequest, ModelTrainResponse, RollbackRequest
from app.schemas.business import DashboardResponse, DashboardKpiResponse


class ModelService:
    @staticmethod
    def _user_id_to_name(db: Session, uid) -> str:
        if not uid:
            return ""
        try:
            u = db.query(User).filter(User.id == int(uid)).first()
            return u.full_name or u.username if u else f"user#{uid}"
        except Exception:
            return str(uid)

    @staticmethod
    def _append_audit_log(mv: ModelVersion, action: str, user_id=None, comment: str = "", extra: Dict[str, Any] = None) -> None:
        """每次审核/回滚/激活都追加一条历史，按时间顺序排列"""
        import json
        from sqlalchemy.orm.attributes import flag_modified
        try:
            existing = None
            if isinstance(mv.audit_log, str):
                try:
                    existing = json.loads(mv.audit_log)
                except Exception:
                    existing = None
            elif isinstance(mv.audit_log, list):
                existing = mv.audit_log
            if not isinstance(existing, list):
                existing = []
            entry = {
                "action": action,
                "status": action,
                "timestamp": datetime.utcnow().isoformat(),
                "time": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat(),
                "user": f"user#{user_id}" if user_id else "",
                "operator": f"user#{user_id}" if user_id else "",
                "reviewer": f"user#{user_id}" if user_id else "",
                "user_id": user_id,
                "comment": comment or "",
                "reason": comment or "",
                "note": comment or "",
            }
            if isinstance(extra, dict):
                for k, v in extra.items():
                    if k not in entry or entry[k] in ("", None):
                        entry[k] = v
            existing.append(entry)
            mv.audit_log = existing
            try:
                flag_modified(mv, "audit_log")
            except Exception:
                pass
        except Exception as e:
            print(f"[ModelService] 追加audit_log失败: {e}")

    @staticmethod
    def _serialize_mv(db: Session, mv: ModelVersion, version_map: Dict[str, Any] = None) -> Dict[str, Any]:
        import json
        history = []
        if isinstance(mv.audit_log, str):
            try:
                history = json.loads(mv.audit_log)
            except Exception:
                history = []
        elif isinstance(mv.audit_log, list):
            history = mv.audit_log
        for h in history:
            uid = h.get("user_id") or h.get("reviewer") and str(h.get("reviewer")).replace("user#", "")
            if uid and not str(uid).startswith("user#"):
                try:
                    name = ModelService._user_id_to_name(db, uid)
                    for k in ("user", "operator", "reviewer"):
                        if not h.get(k) or str(h[k]) == f"user#{uid}":
                            h[k] = name
                except Exception:
                    pass
        reviewed_name = ModelService._user_id_to_name(db, mv.reviewed_by) if mv.reviewed_by else ""
        created_name = ModelService._user_id_to_name(db, mv.created_by) if mv.created_by else ""
        item = {
            "id": mv.id,
            "version": mv.version,
            "model_name": mv.model_name,
            "description": mv.description,
            "training_sample_count": mv.training_sample_count,
            "training_date_range_start": mv.training_date_range_start.isoformat() if mv.training_date_range_start else None,
            "training_date_range_end": mv.training_date_range_end.isoformat() if mv.training_date_range_end else None,
            "metrics": {
                "auc": mv.metrics_auc,
                "accuracy": mv.metrics_accuracy,
                "precision": mv.metrics_precision,
                "recall": mv.metrics_recall,
                "f1": mv.metrics_f1,
                "ks": mv.metrics_ks,
            },
            "is_active": mv.is_active,
            "is_rollback": mv.is_rollback,
            "rollback_from_version": mv.rollback_from_version,
            "rollback_reason": mv.review_comment if mv.is_rollback else None,
            "review_status": mv.review_status,
            "review_comment": mv.review_comment,
            "reviewed_at": mv.reviewed_at.isoformat() if mv.reviewed_at else None,
            "reviewed_by": mv.reviewed_by,
            "reviewer_name": reviewed_name,
            "reviewer_id": mv.reviewed_by,
            "created_by": mv.created_by,
            "creator_name": created_name,
            "activated_at": mv.reviewed_at.isoformat() if (mv.is_active and mv.reviewed_at) else None,
            "review_history": list(history),
            "audit_trail": list(history),
            "created_at": mv.created_at.isoformat() if mv.created_at else None,
        }
        if version_map and mv.version in version_map:
            fs_info = version_map[mv.version]
            fi = fs_info.get("metrics", {}).get("feature_importance", [])
            if fi:
                item["feature_importance"] = fi
        return item

    @staticmethod
    def list_model_versions(db: Session) -> List[Dict[str, Any]]:
        trainer = LightGBMTrainer()
        fs_versions = trainer.list_versions()
        version_map = {v["version"]: v for v in fs_versions}

        db_versions = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()
        result = []
        for mv in db_versions:
            item = ModelService._serialize_mv(db, mv, version_map)
            result.append(item)

        for fv in fs_versions:
            if fv["version"] not in {m["version"] for m in result}:
                fv["id"] = None
                fv["review_status"] = "not_registered"
                fv["review_history"] = fv.get("review_history", [])
                fv["audit_trail"] = fv.get("audit_trail", [])
                result.append(fv)
        return result

    @staticmethod
    def train_model(
        db: Session, request: ModelTrainRequest, user_id: Optional[int] = None
    ) -> Optional[ModelTrainResponse]:
        existing = db.query(ModelVersion).filter(ModelVersion.version == request.version).first()
        if existing:
            return None

        appts_df, depts_df, slots_df = ScoringService._load_appointments_dataframe(
            db, date_from=request.date_from, date_to=request.date_to
        )

        if appts_df.empty or "actual_status" not in appts_df.columns:
            return None

        has_label = appts_df["actual_status"].apply(
            lambda x: str(x).lower() in ["noshow", "no_show", "爽约", "missed", "absent", "attended", "show", "就诊", "已就诊", "pending"]
            if pd.notna(x) else False
        )
        if has_label.sum() < 100:
            return None

        features_df = FeatureEngineer.build_features(appts_df, depts_df, slots_df, is_training=True)
        labels = FeatureEngineer.extract_labels(appts_df)

        trainer = LightGBMTrainer()
        date_range = None
        if request.date_from and request.date_to:
            date_range = (datetime.combine(request.date_from, datetime.min.time()),
                          datetime.combine(request.date_to, datetime.max.time()))

        metadata = trainer.train(
            features_df=features_df,
            labels=labels,
            version=request.version,
            hyperparams=request.hyperparameters,
            test_size=request.test_size,
            random_state=request.random_state,
            description=request.description,
            date_range=date_range,
        )

        metrics = metadata.get("metrics", {})
        mv = ModelVersion(
            version=request.version,
            model_name="LightGBM",
            description=request.description,
            hyperparameters=metadata.get("hyperparameters"),
            feature_columns=metadata.get("feature_columns"),
            training_sample_count=metadata.get("training_sample_count", 0),
            training_date_range_start=datetime.fromisoformat(metadata["training_date_range_start"]) if metadata.get("training_date_range_start") else None,
            training_date_range_end=datetime.fromisoformat(metadata["training_date_range_end"]) if metadata.get("training_date_range_end") else None,
            metrics_auc=metrics.get("auc"),
            metrics_accuracy=metrics.get("accuracy"),
            metrics_precision=metrics.get("precision"),
            metrics_recall=metrics.get("recall"),
            metrics_f1=metrics.get("f1"),
            metrics_ks=metrics.get("ks"),
            is_active=False,
            model_file_path=metadata.get("model_file_path"),
            feature_importance_path=None,
            created_by=user_id,
            review_status="pending",
        )
        db.add(mv)
        ModelService._append_audit_log(mv, "created", user_id=user_id,
                                        comment=f"训练完成：{request.description or '无描述'}",
                                        extra={"version": request.version,
                                               "training_sample_count": metadata.get("training_sample_count", 0),
                                               "metrics": metrics})
        db.commit()
        db.refresh(mv)

        return ModelTrainResponse(
            version=request.version,
            training_sample_count=metadata.get("training_sample_count", 0),
            metrics=metrics,
            feature_importance=metadata.get("feature_importance", []),
            model_file_path=metadata.get("model_file_path", ""),
        )

    @staticmethod
    def activate_model(db: Session, version_id: int, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        mv = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
        if not mv:
            return None
        # ★ 严格前置校验：先加载模型，失败则不改 DB
        if not inference_service.set_active_version(mv.version):
            print(f"[activate_model] 模型 {mv.version} 加载失败，拒绝激活")
            return None
        previous_active = db.query(ModelVersion).filter(
            and_(ModelVersion.id != version_id, ModelVersion.is_active == True)
        ).first()
        db.query(ModelVersion).filter(ModelVersion.is_active == True).update({ModelVersion.is_active: False})
        if previous_active:
            ModelService._append_audit_log(previous_active, "deactivated", user_id=user_id,
                                           comment=f"被版本 {mv.version} 接替下线")
        mv.is_active = True
        mv.review_status = "approved"
        mv.reviewed_by = user_id
        mv.reviewed_at = datetime.utcnow()
        ModelService._append_audit_log(mv, "approved", user_id=user_id,
                                        comment="管理员手动激活上线（模型加载校验已通过）",
                                        extra={"is_active_change": True, "model_loaded": True})
        db.commit()
        inference_service.clear_cache()
        db.refresh(mv)
        return ModelService._serialize_mv(db, mv)

    @staticmethod
    def rollback_model(db: Session, request: RollbackRequest, user_id: Optional[int] = None) -> bool:
        """★ 严格回滚：必须 ①目标版本模型文件存在且可加载 ②推理服务切版本成功，才改 DB/写留痕"""
        target = db.query(ModelVersion).filter(ModelVersion.version == request.target_version).first()
        current_active = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()

        if not target:
            print(f"[rollback_model] 目标版本 {request.target_version} 在 DB 中不存在")
            return False

        # 前置校验 1：文件系统层 — 目标版本模型文件必须存在且可加载（lgb_trainer内已严格校验）
        trainer = LightGBMTrainer()
        src_ver = current_active.version if current_active else "unknown"
        if not trainer.rollback_version(src_ver, request.target_version):
            print(f"[rollback_model] trainer.rollback_version 严格校验失败，回滚中止")
            return False

        # 前置校验 2：推理服务层 — set_active_version 内部 load_model 必须返回 True
        if not inference_service.set_active_version(request.target_version):
            print(f"[rollback_model] 目标版本 {request.target_version} 推理服务加载失败，回滚中止")
            return False

        # ★ 以上两道前置校验全部通过，才开始写入 DB 状态变更 & 留痕
        if current_active:
            current_active.is_active = False
            ModelService._append_audit_log(current_active, "deactivated", user_id=user_id,
                                            comment=f"因回滚操作下线，被版本 {target.version} 接替",
                                            extra={"deactivate_reason": "rollback",
                                                   "rollback_to_version": request.target_version})
        target.is_active = True
        target.is_rollback = True
        target.rollback_from_version = current_active.version if current_active else None
        target.review_status = "approved"
        target.reviewed_by = user_id
        target.reviewed_at = datetime.utcnow()
        target.review_comment = f"回滚操作: {request.reason}"
        ModelService._append_audit_log(target, "rollback", user_id=user_id,
                                        comment=request.reason,
                                        extra={"rollback_from": src_ver,
                                               "is_active_change": True,
                                               "rollback_reason": request.reason,
                                               "model_loaded": True})
        db.commit()
        inference_service.clear_cache()
        print(f"[rollback_model] ✅ 成功: {src_ver} → {request.target_version}")
        return True

    @staticmethod
    def review_model(
        db: Session, version_id: int, status: str, comment: str = "", user_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        mv = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
        if not mv:
            return None
        mv.review_status = status
        mv.review_comment = comment
        mv.reviewed_by = user_id
        mv.reviewed_at = datetime.utcnow()
        if status == "approved":
            was_not_active = not mv.is_active
            # ★ 前置校验：approve 意味着要激活，必须先通过模型加载校验
            if was_not_active:
                if not inference_service.set_active_version(mv.version):
                    print(f"[review_model] 审核通过，但模型 {mv.version} 加载失败，保留 review_status='approved' 但不切 is_active")
                    mv.review_status = "approved"
                    mv.is_active = False
                    failed_note = f" ⚠️ 审核通过但模型加载失败（文件缺失/损坏），请检查模型目录"
                    mv.review_comment = (comment + failed_note) if comment else failed_note.strip()
                    ModelService._append_audit_log(mv, "approved_pending_model", user_id=user_id,
                                                    comment=(comment or "") + failed_note,
                                                    extra={"model_load_failed": True})
                    db.commit()
                    db.refresh(mv)
                    return ModelService._serialize_mv(db, mv)
                previous_active = db.query(ModelVersion).filter(
                    and_(ModelVersion.id != version_id, ModelVersion.is_active == True)
                ).first()
                db.query(ModelVersion).filter(
                    and_(ModelVersion.id != version_id, ModelVersion.is_active == True)
                ).update({ModelVersion.is_active: False})
                if previous_active:
                    ModelService._append_audit_log(previous_active, "deactivated", user_id=user_id,
                                                    comment=f"审核通过版本 {mv.version}，接替下线",
                                                    extra={"deactivate_reason": "review_approved_switch"})
            mv.is_active = True
            ModelService._append_audit_log(mv, "approved", user_id=user_id, comment=comment,
                                            extra={"is_active_change": was_not_active, "model_loaded": True})
        elif status == "rejected":
            was_active = mv.is_active
            if was_active:
                mv.is_active = False
            ModelService._append_audit_log(mv, "rejected", user_id=user_id, comment=comment,
                                            extra={"deactivated_by_reject": was_active})
            if was_active:
                inference_service.clear_cache()
        else:
            ModelService._append_audit_log(mv, "pending", user_id=user_id, comment=comment or "重新置为待审核")
        db.commit()
        db.refresh(mv)
        return ModelService._serialize_mv(db, mv)


class DashboardService:
    @staticmethod
    def get_dashboard(db: Session, days: int = 30) -> DashboardResponse:
        start_date = date.today() - timedelta(days=days)

        total_appointments = db.query(func.count(Appointment.id)).filter(
            Appointment.appointment_date >= start_date
        ).scalar() or 0

        total_scored = db.query(func.count(RiskScore.id)).scalar() or 0

        by_level = db.query(RiskScore.risk_level, func.count(RiskScore.id)).group_by(RiskScore.risk_level).all()
        level_counts = {lvl: cnt for lvl, cnt in by_level}

        actual_no_show = db.query(func.count(Appointment.id)).filter(
            Appointment.actual_status.in_(["noshow", "no_show", "爽约", "missed", "absent"])
        ).scalar() or 0

        predicted_no_show = level_counts.get("high", 0) + level_counts.get("critical", 0)

        correct_predictions = 0
        high_risk_scores = db.query(RiskScore).filter(
            RiskScore.risk_level.in_(["high", "critical"])
        ).all()
        for rs in high_risk_scores:
            if rs.appointment and rs.appointment.actual_status in ["noshow", "no_show", "爽约", "missed", "absent"]:
                correct_predictions += 1
        precision = round(correct_predictions / max(1, predicted_no_show) * 100, 2)
        recall = round(correct_predictions / max(1, actual_no_show) * 100, 2) if actual_no_show > 0 else None

        sms_sent = db.query(func.count(SmsRecord.id)).filter(SmsRecord.send_status == "sent").scalar() or 0
        callbacks_completed = db.query(func.count(CallbackRecord.id)).filter(
            CallbackRecord.callback_status == "completed"
        ).scalar() or 0
        callbacks_pending = db.query(func.count(CallbackRecord.id)).filter(
            CallbackRecord.callback_status == "pending"
        ).scalar() or 0

        kpis = DashboardKpiResponse(
            total_appointments=total_appointments,
            total_scored=total_scored,
            high_risk_count=level_counts.get("high", 0) + level_counts.get("critical", 0),
            medium_risk_count=level_counts.get("medium", 0),
            low_risk_count=level_counts.get("low", 0),
            actual_no_show_count=actual_no_show,
            predicted_no_show_count=predicted_no_show,
            precision_rate=precision,
            recall_rate=recall,
            sms_sent_count=sms_sent,
            callbacks_completed=callbacks_completed,
            callbacks_pending=callbacks_pending,
        )

        daily_scores = db.query(
            func.date(RiskScore.created_at),
            RiskScore.risk_level,
            func.count(RiskScore.id)
        ).filter(
            RiskScore.created_at >= datetime.combine(start_date, datetime.min.time())
        ).group_by(
            func.date(RiskScore.created_at), RiskScore.risk_level
        ).all()

        daily_map: Dict[str, Dict[str, int]] = {}
        for d, lvl, cnt in daily_scores:
            d_str = str(d)
            if d_str not in daily_map:
                daily_map[d_str] = {"low": 0, "medium": 0, "high": 0, "critical": 0}
            daily_map[d_str][lvl] = cnt

        risk_trend = []
        for i in range(days):
            d = (date.today() - timedelta(days=days - 1 - i)).isoformat()
            day_data = daily_map.get(d, {})
            total_day = sum(day_data.values())
            high_ratio = round((day_data.get("high", 0) + day_data.get("critical", 0)) / max(1, total_day) * 100, 2) if total_day > 0 else 0
            risk_trend.append({
                "date": d,
                "value": high_ratio,
                "label": f"高风险占比: {high_ratio}% (样本量: {total_day})"
            })

        dept_dist = db.query(
            Department.name,
            func.count(RiskScore.id),
            func.sum(func.case((RiskScore.risk_level.in_(["high", "critical"]), 1), else_=0))
        ).join(
            Appointment, RiskScore.appointment_id == Appointment.id
        ).join(
            Department, Appointment.department_id == Department.id
        ).group_by(Department.name).all()

        department_distribution = []
        for name, total, high_cnt in dept_dist:
            department_distribution.append({
                "name": name,
                "total": total,
                "high_risk": high_cnt or 0,
                "high_risk_ratio": round((high_cnt or 0) / max(1, total) * 100, 2),
            })

        risk_level_distribution = [
            {"level": "低风险", "count": level_counts.get("low", 0), "color": "#52c41a", "threshold": "<20%"},
            {"level": "中风险", "count": level_counts.get("medium", 0), "color": "#faad14", "threshold": "20%-50%"},
            {"level": "高风险", "count": level_counts.get("high", 0), "color": "#fa8c16", "threshold": "50%-80%"},
            {"level": "极高风险", "count": level_counts.get("critical", 0), "color": "#f5222d", "threshold": ">80%"},
        ]

        from app.services.feedback_service import FeedbackService
        top_errors = FeedbackService.get_error_samples(db, limit=10)

        model_versions = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).limit(10).all()
        model_metrics_history = []
        for mv in model_versions:
            model_metrics_history.append({
                "version": mv.version,
                "created_at": mv.created_at.isoformat() if mv.created_at else None,
                "is_active": mv.is_active,
                "auc": mv.metrics_auc,
                "accuracy": mv.metrics_accuracy,
                "f1": mv.metrics_f1,
                "ks": mv.metrics_ks,
                "sample_count": mv.training_sample_count,
            })

        return DashboardResponse(
            kpis=kpis,
            risk_trend=risk_trend,
            department_distribution=department_distribution,
            risk_level_distribution=risk_level_distribution,
            top_error_samples=top_errors,
            model_metrics_history=model_metrics_history,
        )
