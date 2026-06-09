import os
import json
import logging
import numpy as np
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from config import Config, FEEDBACK_TYPES
from database import Database, DataVersion, RelabelRecord, Alert, FeedbackRecord, MaintenanceRecord
from sqlalchemy import desc, and_, func

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app, resources={r"/api/*": {"origins": "*"}})


def _get_inference_engine():
    from inference_engine import InferenceEngine, AlertManager
    return InferenceEngine(), AlertManager


def _get_trainer():
    from model_trainer import AnomalyModelTrainer
    return AnomalyModelTrainer()


def _get_mlflow_manager():
    from mlflow_manager import MLflowModelManager
    return MLflowModelManager()


def _get_feature_extractor():
    from feature_engineer import FeatureExtractor
    return FeatureExtractor()


def _get_data_loader():
    from data_generator import DataLoader
    return DataLoader()


def _parse_datetime(s: str, default=None):
    if not s:
        return default
    try:
        if "T" in s:
            return datetime.fromisoformat(s.replace("Z", ""))
        return datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
    except Exception:
        try:
            return datetime.strptime(s, "%Y-%m-%d")
        except Exception:
            return default


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/alerts")
def alerts_page():
    return render_template("alerts.html")


@app.route("/monitoring")
def monitoring_page():
    return render_template("monitoring.html")


@app.route("/admin")
def admin_page():
    return render_template("admin.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    db_ok = True
    try:
        session = Database.get_session()
        session.execute("SELECT 1")
        session.close()
    except Exception as e:
        db_ok = False
        logger.error(f"DB check failed: {e}")
    return jsonify({
        "status": "ok",
        "database": db_ok,
        "timestamp": datetime.now().isoformat()
    })


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    _, am = _get_inference_engine()
    status = request.args.get("status")
    equipment_id = request.args.get("equipment_id")
    alert_type = request.args.get("alert_type")
    start_time = _parse_datetime(request.args.get("start_time"))
    end_time = _parse_datetime(request.args.get("end_time"))
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))

    alerts, total = am.list_alerts(
        status=status,
        equipment_id=equipment_id,
        alert_type=alert_type,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
        offset=offset
    )
    return jsonify({
        "data": alerts,
        "total": total,
        "limit": limit,
        "offset": offset
    })


@app.route("/api/alerts/<int:alert_id>", methods=["GET"])
def get_alert_detail(alert_id):
    _, am = _get_inference_engine()
    detail = am.get_alert_detail(alert_id)
    if not detail:
        return jsonify({"error": "Alert not found"}), 404
    return jsonify({"data": detail})


@app.route("/api/alerts/<int:alert_id>/feedback", methods=["POST"])
def submit_feedback(alert_id):
    _, am = _get_inference_engine()
    data = request.get_json() or {}
    feedback_type = data.get("feedback_type")
    feedback_user = data.get("feedback_user", "anonymous")
    feedback_note = data.get("feedback_note", "")
    relabel_from = data.get("relabel_from")

    if feedback_type not in FEEDBACK_TYPES:
        return jsonify({
            "error": f"Invalid feedback_type. Must be one of {list(FEEDBACK_TYPES.keys())}"
        }), 400

    try:
        am.submit_feedback(
            alert_id=alert_id,
            feedback_type=feedback_type,
            feedback_user=feedback_user,
            feedback_note=feedback_note,
            relabel_from=relabel_from
        )
        return jsonify({"success": True, "message": "Feedback submitted"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/alerts/pending/count", methods=["GET"])
def get_pending_count():
    _, am = _get_inference_engine()
    result = am.get_pending_alerts_count()
    return jsonify({"data": result})


@app.route("/api/monitoring/feedback-stats", methods=["GET"])
def get_feedback_stats():
    _, am = _get_inference_engine()
    start_time = _parse_datetime(request.args.get("start_time"))
    end_time = _parse_datetime(request.args.get("end_time"))
    group_by = request.args.get("group_by", "day")

    if not start_time:
        start_time = datetime.now() - timedelta(days=30)
    if not end_time:
        end_time = datetime.now()

    stats = am.get_feedback_statistics(start_time, end_time, group_by)
    return jsonify({"data": stats})


@app.route("/api/monitoring/alert-trends", methods=["GET"])
def get_alert_trends():
    start_time = _parse_datetime(request.args.get("start_time"))
    end_time = _parse_datetime(request.args.get("end_time"))
    if not start_time:
        start_time = datetime.now() - timedelta(days=30)
    if not end_time:
        end_time = datetime.now()

    session = Database.get_session()
    try:
        days = (end_time - start_time).days
        trends = {}
        for d in range(days + 1):
            day = (start_time + timedelta(days=d)).strftime("%Y-%m-%d")
            trends[day] = {"轴承磨损": 0, "传感器漂移": 0, "confirmed": 0, "pending": 0}

        alerts = session.query(Alert).filter(
            Alert.timestamp >= start_time,
            Alert.timestamp <= end_time
        ).all()

        for alert in alerts:
            day = alert.timestamp.strftime("%Y-%m-%d")
            if day in trends:
                if alert.alert_type in trends[day]:
                    trends[day][alert.alert_type] += 1
                if alert.status == "pending":
                    trends[day]["pending"] += 1
                else:
                    trends[day]["confirmed"] += 1

        return jsonify({"data": trends})
    finally:
        session.close()


@app.route("/api/monitoring/daily-summary", methods=["GET"])
def get_daily_summary():
    session = Database.get_session()
    try:
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)

        today_start = datetime.combine(today, datetime.min.time())
        week_start = datetime.combine(week_ago, datetime.min.time())

        today_alerts = session.query(Alert).filter(Alert.timestamp >= today_start).count()
        today_feedback = session.query(FeedbackRecord).filter(FeedbackRecord.created_at >= today_start).count()
        pending = session.query(Alert).filter(Alert.status == "pending").count()

        weekly_alerts = session.query(Alert).filter(Alert.timestamp >= week_start).count()
        weekly_feedback = session.query(FeedbackRecord).filter(
            FeedbackRecord.created_at >= week_start
        ).count()

        fb_types = ["REAL_FAULT", "SENSOR_DRIFT", "FALSE_ALARM"]
        fb_counts = {}
        for ft in fb_types:
            fb_counts[ft] = session.query(FeedbackRecord).filter(
                FeedbackRecord.created_at >= week_start,
                FeedbackRecord.feedback_type == ft
            ).count()

        return jsonify({
            "data": {
                "today": {
                    "alerts": today_alerts,
                    "feedback": today_feedback,
                    "pending": pending
                },
                "weekly": {
                    "alerts": weekly_alerts,
                    "feedback": weekly_feedback,
                    "feedback_by_type": fb_counts
                }
            }
        })
    finally:
        session.close()


@app.route("/api/models", methods=["GET"])
def list_models():
    mm = _get_mlflow_manager()
    models = mm.list_model_versions()
    return jsonify({"data": models})


@app.route("/api/models/deployed/detail", methods=["GET"])
def get_deployed_model_detail():
    mm = _get_mlflow_manager()
    trainer = _get_trainer()

    deployed_version = None
    deployed_ts = None
    storage_path = None
    full_test_metrics = {}
    label_distribution = {}
    dataset_info = {}
    feature_importance_top = []

    deployed_path = os.path.join(Config.MODEL_DIR, "deployed")
    metadata_file = os.path.join(deployed_path, "metadata.json")
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                meta = json.load(f)
                deployed_version = meta.get("model_version")
                deployed_ts = meta.get("deployed_at")
                storage_path = meta.get("model_path")
        except Exception:
            pass

    if not deployed_version:
        versions = mm.list_model_versions()
        if versions:
            for mv in versions:
                if mv.get("is_deployed"):
                    deployed_version = mv.get("version")
                    deployed_ts = mv.get("created_at")
                    break
            if not deployed_version and versions:
                deployed_version = versions[0].get("version")
                deployed_ts = versions[0].get("created_at")

    if deployed_version:
        version_model_dir = os.path.join(Config.MODEL_DIR, deployed_version)
        if not os.path.isdir(version_model_dir):
            import glob
            candidates = glob.glob(os.path.join(Config.MODEL_DIR, f"*{deployed_version}*"))
            for cand in candidates:
                if os.path.isdir(cand):
                    version_model_dir = cand
                    break

        if os.path.isdir(version_model_dir):
            for fname in ["metadata.json", "metrics.json", "training_result.json"]:
                fpath = os.path.join(version_model_dir, fname)
                if not os.path.exists(fpath):
                    continue
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if fname == "metadata.json":
                        meta_metrics = data.get("metrics", {})
                        if isinstance(meta_metrics, dict) and meta_metrics:
                            full_test_metrics.update(meta_metrics)
                        label_distribution = data.get("label_distribution", label_distribution) or label_distribution
                        dataset_info = data.get("dataset_info", dataset_info) or dataset_info
                        feature_importance_top = data.get("feature_importance_top", feature_importance_top) or feature_importance_top
                        if not deployed_version:
                            deployed_version = data.get("model_version", deployed_version)
                    elif fname == "metrics.json":
                        if isinstance(data, dict) and data:
                            full_test_metrics.update(data)
                    elif fname == "training_result.json":
                        tm = data.get("test_metrics", {})
                        if isinstance(tm, dict) and tm:
                            full_test_metrics.update(tm)
                        di = data.get("dataset_info", {})
                        if di:
                            dataset_info.update(di)
                            label_distribution = di.get("class_distribution", label_distribution) or label_distribution
                        fi_raw = {}
                        if data.get("feature_names"):
                            try:
                                if hasattr(trainer, 'get_feature_importance'):
                                    pass
                            except Exception:
                                pass
                except Exception as e:
                    logger.warning(f"Read {fname} failed: {e}")

        detail_from_db = mm.get_model_detail(deployed_version)
        if detail_from_db:
            db_metrics = detail_from_db.get("test_metrics", {}) or {}
            for k, v in db_metrics.items():
                if k not in full_test_metrics and v is not None:
                    full_test_metrics[k] = v
            if not label_distribution:
                label_distribution = detail_from_db.get("label_distribution", {}) or {}
            if not dataset_info:
                dataset_info = detail_from_db.get("dataset_info", {}) or {}
            if not feature_importance_top:
                feature_importance_top = detail_from_db.get("feature_importance_top", []) or []

    required_metrics = ["accuracy", "precision", "recall", "f1"]
    for rm in required_metrics:
        if rm not in full_test_metrics or full_test_metrics[rm] is None:
            macro_key = f"{rm}_macro"
            if macro_key in full_test_metrics and full_test_metrics[macro_key] is not None:
                full_test_metrics[rm] = full_test_metrics[macro_key]

    if not deployed_version:
        return jsonify({
            "error": "No deployed model found",
            "data": None
        }), 404

    def _safe_float(v, default=0.0):
        try:
            if v is None: return default
            fv = float(v)
            if np.isnan(fv) or np.isinf(fv): return default
            return fv
        except Exception:
            return default

    return jsonify({
        "data": {
            "version": deployed_version,
            "deployed_at": deployed_ts,
            "model_path": storage_path,
            "metrics_source_file": "metadata.json / metrics.json / training_result.json",
            "metrics": {
                "accuracy": _safe_float(full_test_metrics.get("accuracy")),
                "precision": _safe_float(full_test_metrics.get("precision")),
                "recall": _safe_float(full_test_metrics.get("recall")),
                "f1": _safe_float(full_test_metrics.get("f1")),
                "accuracy_macro": _safe_float(full_test_metrics.get("accuracy_macro", full_test_metrics.get("accuracy"))),
                "precision_macro": _safe_float(full_test_metrics.get("precision_macro", full_test_metrics.get("precision"))),
                "recall_macro": _safe_float(full_test_metrics.get("recall_macro", full_test_metrics.get("recall"))),
                "f1_macro": _safe_float(full_test_metrics.get("f1_macro", full_test_metrics.get("f1"))),
                "roc_auc": _safe_float(full_test_metrics.get("roc_auc")),
                "per_class": full_test_metrics.get("per_class_precision_recall_f1") or {
                    cls: {
                        "precision": _safe_float((full_test_metrics.get("precision_per_class") or {}).get(cls)),
                        "recall": _safe_float((full_test_metrics.get("recall_per_class") or {}).get(cls)),
                        "f1": _safe_float((full_test_metrics.get("f1_per_class") or {}).get(cls))
                    } for cls in (list(label_distribution.keys()) if label_distribution else ["正常", "轴承磨损", "传感器漂移"])
                },
                "confusion_matrix": full_test_metrics.get("confusion_matrix", []),
                "classification_report": full_test_metrics.get("classification_report", {}),
            },
            "dataset_info": dataset_info,
            "label_distribution": label_distribution,
            "feature_importance_top": feature_importance_top,
            "all_metrics_keys_found": sorted(list(full_test_metrics.keys())),
        }
    })


@app.route("/api/training-dataset-summary", methods=["GET"])
def get_training_dataset_summary():
    from database import (
        Database, FeatureRecord, FeedbackRecord,
        FEATURE_SOURCE_UNCONFIRMED, FEATURE_SOURCE_ENGINEER_CONFIRMED,
        FEATURE_SOURCE_AUTO_LABELED, FEATURE_SOURCE_RELABELED,
        TRAINING_ALLOWED_SOURCES
    )
    from sqlalchemy import func, case

    session = Database.get_session()
    try:
        source_counts_raw = session.query(
            FeatureRecord.source,
            func.count(FeatureRecord.id)
        ).group_by(FeatureRecord.source).all()
        source_counts = {src: cnt for (src, cnt) in source_counts_raw}

        label_counts_raw = session.query(
            FeatureRecord.source,
            FeatureRecord.label,
            func.count(FeatureRecord.id)
        ).filter(FeatureRecord.label != None).group_by(
            FeatureRecord.source, FeatureRecord.label
        ).all()
        by_source_label = {}
        for src, lbl, cnt in label_counts_raw:
            by_source_label.setdefault(src, {})[lbl] = cnt

        allowed_total = sum(source_counts.get(s, 0) for s in TRAINING_ALLOWED_SOURCES)
        unconfirmed_total = source_counts.get(FEATURE_SOURCE_UNCONFIRMED, 0)

        total_feedback = session.query(func.count(FeedbackRecord.id)).scalar() or 0

        allowed_label_dist_raw = session.query(
            FeatureRecord.label,
            func.count(FeatureRecord.id)
        ).filter(
            FeatureRecord.source.in_(TRAINING_ALLOWED_SOURCES),
            FeatureRecord.label != None
        ).group_by(FeatureRecord.label).all()
        allowed_label_dist = {lbl: cnt for (lbl, cnt) in allowed_label_dist_raw}

        timeline_raw_all = session.query(
            FeatureRecord.created_at,
            FeatureRecord.source
        ).order_by(FeatureRecord.created_at).limit(10000).all()
        timeline_by_day = {}
        for (dt, src) in timeline_raw_all:
            if dt is None:
                day_key = "unknown"
            else:
                day_key = dt.date().isoformat() if hasattr(dt, 'date') else str(dt)[:10]
            key = (day_key, src)
            timeline_by_day[key] = timeline_by_day.get(key, 0) + 1
        timeline = [
            {"date": k[0], "source": k[1], "count": v}
            for k, v in sorted(timeline_by_day.items(), key=lambda x: (x[0][0], x[0][1]))
        ][-30:]

        return jsonify({
            "data": {
                "by_source_count": source_counts,
                "by_source_label": by_source_label,
                "training_allowed_sources": TRAINING_ALLOWED_SOURCES,
                "training_unconfirmed_source": FEATURE_SOURCE_UNCONFIRMED,
                "total_allowed_samples": allowed_total,
                "total_unconfirmed_samples": unconfirmed_total,
                "total_feature_records": sum(source_counts.values()),
                "total_feedback_records": total_feedback,
                "allowed_label_distribution": allowed_label_dist,
                "strict_training_rule_enabled": True,
                "ready_for_training": allowed_total >= 15,
                "min_required_samples": 15,
                "timeline_30d": timeline,
                "source_explain": {
                    FEATURE_SOURCE_UNCONFIRMED: "历史原始传感器数据生成，需要工程师人工确认后方可进入训练集",
                    FEATURE_SOURCE_ENGINEER_CONFIRMED: "工程师在告警管理页确认的样本，已准入训练集",
                    FEATURE_SOURCE_AUTO_LABELED: "冷启动阶段自动标注的种子样本，用于初始模型训练",
                    FEATURE_SOURCE_RELABELED: "工程师对已有样本进行改标后的结果，已准入训练集"
                }
            }
        })
    finally:
        session.close()


@app.route("/api/models/<version>", methods=["GET"])
def get_model_detail(version):
    mm = _get_mlflow_manager()
    detail = mm.get_model_detail(version)
    if not detail:
        return jsonify({"error": "Model not found"}), 404
    return jsonify({"data": detail})


@app.route("/api/models/<version>/deploy", methods=["POST"])
def deploy_model(version):
    mm = _get_mlflow_manager()
    try:
        mm.deploy_model(version)
        return jsonify({"success": True, "message": f"Model {version} deployed"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Deploy error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/models/train", methods=["POST"])
def train_model():
    from data_generator import DataLoader

    data = request.get_json() or {}
    model_type = data.get("model_type", "gb")
    description = data.get("description", "")
    include_feedback = data.get("include_feedback", True)
    use_historical_data = data.get("use_historical_data", True)
    auto_seed_samples = data.get("auto_seed_samples", True)

    try:
        trainer = _get_trainer()
        fe = _get_feature_extractor()
        mm = _get_mlflow_manager()

        pre_summary = trainer.get_training_dataset_summary()

        if use_historical_data and pre_summary.get("total_feature_records", 0) < 100:
            loader = _get_data_loader()
            raw_df = loader.load_sensor_data(exclude_downtime=True)
            if not raw_df.empty:
                fe.extract_and_save_features(raw_df, exclude_downtime=True)

        result = trainer.train(
            feature_df=None,
            label_series=None,
            model_type=model_type,
            include_feedback=include_feedback,
            auto_seed_samples=auto_seed_samples,
            strict_from_db_only=True,
            description=description or "API触发训练 - 严格准入模式 (raw_label已排除, 仅工程师确认+种子样本)"
        )

        model_version, model_uri = mm.register_model(
            trainer, result, trained_by="api_user"
        )

        try:
            mm.deploy_model(model_version)
            deploy_msg = f"Model {model_version} deployed automatically"
        except Exception as e:
            deploy_msg = f"Training successful but auto-deploy failed: {e}"

        post_summary = trainer.get_training_dataset_summary()

        return jsonify({
            "success": True,
            "model_version": model_version,
            "model_uri": model_uri,
            "metrics": result["test_metrics"],
            "deploy_status": deploy_msg,
            "training_result": result,
            "strict_training_note": "本次训练严格仅使用 source=engineer_confirmed/engineer_relabeled/auto_labeled_seed 样本，历史传感器 raw_label (historical_unconfirmed) 已全部排除",
            "dataset_summary_before": pre_summary,
            "dataset_summary_after": post_summary
        })
    except Exception as e:
        logger.exception(f"Training error")
        return jsonify({"error": str(e)}), 500


@app.route("/api/inference/run", methods=["POST"])
def run_inference():
    data = request.get_json() or {}
    equipment_ids = data.get("equipment_ids")
    lookback = int(data.get("lookback_minutes", 60))

    try:
        ie, _ = _get_inference_engine()
        if not ie.is_model_ready():
            return jsonify({
                "error": "No deployed model available. Train and deploy a model first."
            }), 400

        result = ie.run_batch_inference(equipment_ids=equipment_ids, lookback_minutes=lookback)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        logger.error(f"Inference error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/data-versions", methods=["GET"])
def list_data_versions():
    session = Database.get_session()
    try:
        versions = session.query(DataVersion).order_by(
            desc(DataVersion.created_at)
        ).limit(100).all()

        result = []
        for v in versions:
            fb_ids = v.included_feedback_ids
            if isinstance(fb_ids, str):
                try:
                    fb_ids = json.loads(fb_ids)
                except Exception:
                    fb_ids = []
            result.append({
                "id": v.id,
                "version": v.version,
                "description": v.description,
                "record_count": v.record_count,
                "positive_count": v.positive_count,
                "feature_count": v.feature_count,
                "feedback_count": len(fb_ids) if fb_ids else 0,
                "created_by": v.created_by,
                "created_at": v.created_at.isoformat() if v.created_at else None
            })
        return jsonify({"data": result})
    finally:
        session.close()


@app.route("/api/data-versions/<version>", methods=["GET"])
def get_data_version_detail(version):
    session = Database.get_session()
    try:
        v = session.query(DataVersion).filter(DataVersion.version == version).first()
        if not v:
            return jsonify({"error": "Data version not found"}), 404

        fb_ids = v.included_feedback_ids
        if isinstance(fb_ids, str):
            try:
                fb_ids = json.loads(fb_ids)
            except Exception:
                fb_ids = []

        related_models = []
        from database import ModelVersion
        models = session.query(ModelVersion).filter(
            ModelVersion.training_data_version == version
        ).all()
        for m in models:
            related_models.append({
                "version": m.version,
                "f1_score": m.f1_score,
                "is_deployed": m.is_deployed
            })

        return jsonify({
            "data": {
                "id": v.id,
                "version": v.version,
                "description": v.description,
                "record_count": v.record_count,
                "positive_count": v.positive_count,
                "feature_count": v.feature_count,
                "included_feedback_ids": fb_ids,
                "feedback_count": len(fb_ids) if fb_ids else 0,
                "related_models": related_models,
                "created_by": v.created_by,
                "created_at": v.created_at.isoformat() if v.created_at else None
            }
        })
    finally:
        session.close()


@app.route("/api/relabel-records", methods=["GET"])
def list_relabel_records():
    session = Database.get_session()
    try:
        limit = int(request.args.get("limit", 100))
        offset = int(request.args.get("offset", 0))

        query = session.query(RelabelRecord)
        total = query.count()

        records = query.order_by(desc(RelabelRecord.created_at)) \
            .offset(offset).limit(limit).all()

        result = []
        for r in records:
            result.append({
                "id": r.id,
                "alert_id": r.alert_id,
                "original_label": r.original_label,
                "new_label": r.new_label,
                "relabel_reason": r.relabel_reason,
                "relabel_user": r.relabel_user,
                "data_version": r.data_version,
                "created_at": r.created_at.isoformat() if r.created_at else None
            })
        return jsonify({"data": result, "total": total})
    finally:
        session.close()


@app.route("/api/feedback-records", methods=["GET"])
def list_feedback_records():
    session = Database.get_session()
    try:
        limit = int(request.args.get("limit", 100))
        offset = int(request.args.get("offset", 0))
        is_used = request.args.get("is_used_for_training")

        query = session.query(FeedbackRecord)
        if is_used is not None:
            query = query.filter(FeedbackRecord.is_used_for_training == (is_used.lower() == "true"))

        total = query.count()
        records = query.order_by(desc(FeedbackRecord.created_at)) \
            .offset(offset).limit(limit).all()

        result = []
        for r in records:
            result.append({
                "id": r.id,
                "alert_id": r.alert_id,
                "feedback_type": r.feedback_type,
                "feedback_note": r.feedback_note,
                "feedback_user": r.feedback_user,
                "is_used_for_training": r.is_used_for_training,
                "training_data_version": r.training_data_version,
                "created_at": r.created_at.isoformat() if r.created_at else None
            })
        return jsonify({"data": result, "total": total})
    finally:
        session.close()


@app.route("/api/equipment/list", methods=["GET"])
def list_equipment():
    session = Database.get_session()
    try:
        from database import SensorReading
        rows = session.query(SensorReading.equipment_id).distinct().all()
        equipment_ids = [r[0] for r in rows]
        return jsonify({"data": equipment_ids})
    finally:
        session.close()


@app.route("/api/equipment/<equipment_id>/stats", methods=["GET"])
def get_equipment_stats(equipment_id):
    session = Database.get_session()
    try:
        start_time = _parse_datetime(request.args.get("start_time"))
        end_time = _parse_datetime(request.args.get("end_time"))
        if not start_time:
            start_time = datetime.now() - timedelta(days=7)
        if not end_time:
            end_time = datetime.now()

        from database import SensorReading
        query = session.query(SensorReading).filter(
            SensorReading.equipment_id == equipment_id,
            SensorReading.timestamp >= start_time,
            SensorReading.timestamp <= end_time,
            SensorReading.is_downtime == False
        )
        total_readings = query.count()

        alert_count = session.query(Alert).filter(
            Alert.equipment_id == equipment_id,
            Alert.timestamp >= start_time,
            Alert.timestamp <= end_time
        ).count()

        pending_count = session.query(Alert).filter(
            Alert.equipment_id == equipment_id,
            Alert.status == "pending"
        ).count()

        return jsonify({
            "data": {
                "equipment_id": equipment_id,
                "total_readings": total_readings,
                "alert_count": alert_count,
                "pending_count": pending_count,
                "period": {
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat()
                }
            }
        })
    finally:
        session.close()


@app.route("/api/generate-data", methods=["POST"])
def generate_sample_data():
    data = request.get_json() or {}
    days = int(data.get("days", 30))
    from data_generator import SensorDataGenerator
    from datetime import datetime

    try:
        gen = SensorDataGenerator()
        start_date = datetime.now() - timedelta(days=days)
        df = gen.generate_historical_data(
            start_date=start_date,
            days=days,
            insert_to_db=True
        )
        return jsonify({
            "success": True,
            "message": f"Generated {len(df)} sensor readings",
            "record_count": len(df),
            "equipment_ids": gen.equipment_ids
        })
    except Exception as e:
        logger.exception(f"Data generation error")
        return jsonify({"error": str(e)}), 500


@app.route("/api/init-database", methods=["POST"])
def init_database():
    data = request.get_json() or {}
    drop_first = data.get("drop_first", False)
    try:
        Database.init_tables(drop_first=drop_first)
        return jsonify({
            "success": True,
            "message": "Database initialized successfully"
        })
    except Exception as e:
        logger.exception(f"DB init error")
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    logger.exception(f"Internal error: {e}")
    return jsonify({"error": "Internal server error"}), 500


def create_app():
    return app


if __name__ == "__main__":
    logger.info(f"Starting server on {Config.FLASK_HOST}:{Config.FLASK_PORT}")
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=False,
        threaded=True
    )
