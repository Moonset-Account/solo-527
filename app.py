import os
import json
import logging
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

    try:
        trainer = _get_trainer()
        fe = _get_feature_extractor()
        mm = _get_mlflow_manager()

        if use_historical_data:
            loader = _get_data_loader()
            raw_df = loader.load_sensor_data(exclude_downtime=True)
            if raw_df.empty:
                return jsonify({
                    "error": "No historical data available. Generate sample data first."
                }), 400
            feature_df = fe.extract_and_save_features(raw_df, exclude_downtime=True)
            if feature_df.empty:
                return jsonify({"error": "No features extracted from data"}), 400
            label_series = feature_df["label"]
            feature_cols = [c for c in feature_df.columns if c not in [
                "label", "equipment_id", "window_start", "window_end", "data_version"
            ]]
            feature_df = feature_df[feature_cols]
        else:
            feature_df, label_series = None, None

        result = trainer.train(
            feature_df=feature_df,
            label_series=label_series,
            model_type=model_type,
            include_feedback=include_feedback,
            description=description
        )

        model_version, model_uri = mm.register_model(
            trainer, result, trained_by="api_user"
        )

        try:
            mm.deploy_model(model_version)
            deploy_msg = f"Model {model_version} deployed automatically"
        except Exception as e:
            deploy_msg = f"Training successful but auto-deploy failed: {e}"

        return jsonify({
            "success": True,
            "model_version": model_version,
            "model_uri": model_uri,
            "metrics": result["test_metrics"],
            "deploy_status": deploy_msg,
            "training_result": result
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
