import numpy as np
import pandas as pd
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from config import Config
from database import Database, Alert, SensorReading, MaintenanceRecord
from sqlalchemy import and_, or_, desc
from mlflow_manager import MLflowModelManager
from feature_engineer import FeatureExtractor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InferenceEngine:
    def __init__(self):
        self.model_manager = MLflowModelManager()
        self.feature_extractor = FeatureExtractor()
        self._pipeline = None
        self._metadata = None
        self._model_version = None
        self._load_deployed_model()

    def _load_deployed_model(self):
        result = self.model_manager.get_deployed_model()
        if result:
            self._pipeline, self._metadata = result
            self._model_version = self._metadata.get("model_version", "unknown")
            logger.info(f"Loaded deployed model version: {self._model_version}")
        else:
            logger.warning("No deployed model found. Run training and deploy a model first.")

    def reload_model(self):
        self._load_deployed_model()

    def is_model_ready(self) -> bool:
        return self._pipeline is not None

    def _batch_predict(
        self,
        feature_dicts: List[Dict]
    ) -> Tuple[List[str], List[Dict[str, float]]]:
        if not self.is_model_ready():
            raise RuntimeError("No deployed model available. Please train and deploy a model first.")

        feature_names = self._metadata.get("feature_names", [])
        df = pd.DataFrame(feature_dicts)

        missing_cols = [c for c in feature_names if c not in df.columns]
        for col in missing_cols:
            df[col] = 0.0

        df = df[feature_names].fillna(0)

        y_pred = self._pipeline.predict(df)
        y_proba = self._pipeline.predict_proba(df)

        label_classes = self._metadata.get(
            "label_classes",
            ["正常", "传感器漂移", "轴承磨损"]
        )

        labels = []
        probabilities = []

        for i in range(len(y_pred)):
            label_idx = y_pred[i] if isinstance(y_pred[i], (int, np.integer)) else label_classes.index(y_pred[i]) if y_pred[i] in label_classes else 0
            labels.append(label_classes[label_idx])
            proba_dict = {}
            for j, cls in enumerate(label_classes):
                if j < y_proba.shape[1]:
                    proba_dict[cls] = float(y_proba[i][j])
                else:
                    proba_dict[cls] = 0.0
            probabilities.append(proba_dict)

        return labels, probabilities

    def run_inference_on_sensor_data(
        self,
        equipment_id: str,
        lookback_minutes: int = 60,
        end_time: datetime = None
    ) -> List[Dict]:
        if end_time is None:
            end_time = datetime.now()
        start_time = end_time - timedelta(minutes=lookback_minutes)

        session = Database.get_session()
        try:
            readings = session.query(SensorReading).filter(
                SensorReading.equipment_id == equipment_id,
                SensorReading.timestamp >= start_time,
                SensorReading.timestamp <= end_time,
                SensorReading.is_downtime == False
            ).order_by(SensorReading.timestamp).all()

            if not readings:
                return []

            data = []
            for r in readings:
                data.append({
                    "equipment_id": r.equipment_id,
                    "timestamp": r.timestamp,
                    "temperature": r.temperature,
                    "vibration": r.vibration,
                    "current": r.current,
                    "rpm": r.rpm,
                    "shift": r.shift,
                    "is_downtime": r.is_downtime,
                    "raw_label": r.raw_label,
                })
            df = pd.DataFrame(data)
        finally:
            session.close()

        features_list, _, window_infos = self.feature_extractor.generate_sliding_windows(
            df, exclude_downtime=True, generate_labels=False
        )

        if not features_list:
            return []

        labels, probabilities = self._batch_predict(features_list)

        results = []
        for i in range(len(features_list)):
            results.append({
                "equipment_id": equipment_id,
                "window_start": window_infos[i][0],
                "window_end": window_infos[i][1],
                "predicted_label": labels[i],
                "probabilities": probabilities[i],
                "features": features_list[i],
            })

        return results

    def generate_alerts(
        self,
        inference_results: List[Dict],
        alert_threshold: float = None
    ) -> List[int]:
        if alert_threshold is None:
            alert_threshold = Config.ALERT_THRESHOLD

        alert_ids = []
        session = Database.get_session()

        try:
            for result in inference_results:
                label = result["predicted_label"]
                probs = result["probabilities"]

                should_alert = False
                alert_type = None
                confidence = 0.0

                if label in ["轴承磨损", "传感器漂移"]:
                    confidence = probs.get(label, 0.0)
                    if confidence >= alert_threshold:
                        should_alert = True
                        alert_type = label

                if not should_alert:
                    continue

                start = result["window_start"]
                end = result["window_end"]
                existing = session.query(Alert).filter(
                    Alert.equipment_id == result["equipment_id"],
                    Alert.status == "pending",
                    Alert.alert_type == alert_type,
                    Alert.feature_window_start <= end,
                    Alert.feature_window_end >= start
                ).first()

                if existing:
                    continue

                snapshot_data = self._get_sensor_snapshot(
                    result["equipment_id"], start, end, session
                )

                alert = Alert(
                    equipment_id=result["equipment_id"],
                    timestamp=end,
                    alert_type=alert_type,
                    confidence=confidence,
                    model_version=self._model_version,
                    feature_window_start=start,
                    feature_window_end=end,
                    sensor_snapshot=json.dumps(snapshot_data, default=str),
                    status="pending"
                )
                session.add(alert)
                session.flush()
                alert_ids.append(alert.id)

            session.commit()
            logger.info(f"Generated {len(alert_ids)} new alerts")
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to generate alerts: {e}")
            raise e
        finally:
            session.close()

        return alert_ids

    def _get_sensor_snapshot(
        self,
        equipment_id: str,
        start_time: datetime,
        end_time: datetime,
        session
    ) -> Dict:
        try:
            readings = session.query(SensorReading).filter(
                SensorReading.equipment_id == equipment_id,
                SensorReading.timestamp >= start_time,
                SensorReading.timestamp <= end_time
            ).order_by(SensorReading.timestamp).all()

            if not readings:
                return {}

            sample_points = min(len(readings), 100)
            step = max(1, len(readings) // sample_points)
            sampled = readings[::step]

            return {
                "timestamps": [r.timestamp.isoformat() for r in sampled],
                "temperature": [r.temperature for r in sampled],
                "vibration": [r.vibration for r in sampled],
                "current": [r.current for r in sampled],
                "rpm": [r.rpm for r in sampled],
                "summary": {
                    "count": len(readings),
                    "temp_mean": float(np.nanmean([r.temperature for r in readings])),
                    "vib_mean": float(np.nanmean([r.vibration for r in readings])),
                    "curr_mean": float(np.nanmean([r.current for r in readings])),
                    "rpm_mean": float(np.nanmean([r.rpm for r in readings])),
                }
            }
        except Exception:
            return {}

    def run_batch_inference(
        self,
        equipment_ids: List[str] = None,
        lookback_minutes: int = 60
    ) -> Dict:
        if equipment_ids is None:
            session = Database.get_session()
            try:
                rows = session.query(SensorReading.equipment_id).distinct().all()
                equipment_ids = [r[0] for r in rows]
            finally:
                session.close()

        all_results = []
        total_alerts = 0

        for eq_id in equipment_ids:
            try:
                results = self.run_inference_on_sensor_data(
                    eq_id, lookback_minutes=lookback_minutes
                )
                alert_ids = self.generate_alerts(results)
                all_results.extend(results)
                total_alerts += len(alert_ids)
            except Exception as e:
                logger.error(f"Error processing {eq_id}: {e}")
                continue

        return {
            "total_equipment_processed": len(equipment_ids),
            "total_inference_results": len(all_results),
            "total_new_alerts": total_alerts,
            "timestamp": datetime.now().isoformat(),
            "model_version": self._model_version
        }


class AlertManager:
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_RESOLVED = "resolved"

    FEEDBACK_FAULT = "REAL_FAULT"
    FEEDBACK_DRIFT = "SENSOR_DRIFT"
    FEEDBACK_FALSE = "FALSE_ALARM"

    @staticmethod
    def list_alerts(
        status: str = None,
        equipment_id: str = None,
        alert_type: str = None,
        start_time: datetime = None,
        end_time: datetime = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[Dict], int]:
        session = Database.get_session()
        try:
            query = session.query(Alert)
            if status:
                query = query.filter(Alert.status == status)
            if equipment_id:
                query = query.filter(Alert.equipment_id == equipment_id)
            if alert_type:
                query = query.filter(Alert.alert_type == alert_type)
            if start_time:
                query = query.filter(Alert.timestamp >= start_time)
            if end_time:
                query = query.filter(Alert.timestamp <= end_time)

            total = query.count()

            alerts = query.order_by(desc(Alert.timestamp)) \
                .offset(offset).limit(limit).all()

            result = []
            for alert in alerts:
                snapshot = alert.sensor_snapshot
                if isinstance(snapshot, str):
                    try:
                        snapshot = json.loads(snapshot)
                    except Exception:
                        snapshot = {}
                result.append({
                    "id": alert.id,
                    "equipment_id": alert.equipment_id,
                    "timestamp": alert.timestamp.isoformat() if alert.timestamp else None,
                    "alert_type": alert.alert_type,
                    "confidence": alert.confidence,
                    "model_version": alert.model_version,
                    "feature_window_start": alert.feature_window_start.isoformat() if alert.feature_window_start else None,
                    "feature_window_end": alert.feature_window_end.isoformat() if alert.feature_window_end else None,
                    "sensor_snapshot": snapshot,
                    "status": alert.status,
                    "feedback_type": alert.feedback_type,
                    "feedback_note": alert.feedback_note,
                    "feedback_user": alert.feedback_user,
                    "feedback_at": alert.feedback_at.isoformat() if alert.feedback_at else None,
                    "created_at": alert.created_at.isoformat() if alert.created_at else None,
                })
            return result, total
        finally:
            session.close()

    @staticmethod
    def get_alert_detail(alert_id: int) -> Optional[Dict]:
        session = Database.get_session()
        try:
            alert = session.query(Alert).filter(Alert.id == alert_id).first()
            if not alert:
                return None

            snapshot = alert.sensor_snapshot
            if isinstance(snapshot, str):
                try:
                    snapshot = json.loads(snapshot)
                except Exception:
                    snapshot = {}

            return {
                "id": alert.id,
                "equipment_id": alert.equipment_id,
                "timestamp": alert.timestamp.isoformat() if alert.timestamp else None,
                "alert_type": alert.alert_type,
                "confidence": alert.confidence,
                "model_version": alert.model_version,
                "feature_window_start": alert.feature_window_start.isoformat() if alert.feature_window_start else None,
                "feature_window_end": alert.feature_window_end.isoformat() if alert.feature_window_end else None,
                "sensor_snapshot": snapshot,
                "status": alert.status,
                "feedback_type": alert.feedback_type,
                "feedback_note": alert.feedback_note,
                "feedback_user": alert.feedback_user,
                "feedback_at": alert.feedback_at.isoformat() if alert.feedback_at else None,
                "created_at": alert.created_at.isoformat() if alert.created_at else None,
            }
        finally:
            session.close()

    @staticmethod
    def submit_feedback(
        alert_id: int,
        feedback_type: str,
        feedback_user: str,
        feedback_note: str = "",
        relabel_from: str = None
    ) -> bool:
        from database import (
            FeedbackRecord, RelabelRecord, FeatureRecord,
            FEATURE_SOURCE_ENGINEER_CONFIRMED, FEATURE_SOURCE_RELABELED
        )
        import json

        if feedback_type not in [AlertManager.FEEDBACK_FAULT, AlertManager.FEEDBACK_DRIFT, AlertManager.FEEDBACK_FALSE]:
            raise ValueError(f"Invalid feedback type: {feedback_type}")

        FEEDBACK_TO_LABEL = {
            AlertManager.FEEDBACK_FAULT: "轴承磨损",
            AlertManager.FEEDBACK_DRIFT: "传感器漂移",
            AlertManager.FEEDBACK_FALSE: "正常",
        }
        final_label = FEEDBACK_TO_LABEL[feedback_type]

        session = Database.get_session()
        try:
            alert = session.query(Alert).filter(Alert.id == alert_id).first()
            if not alert:
                raise ValueError(f"Alert {alert_id} not found")

            alert.status = AlertManager.STATUS_CONFIRMED
            alert.feedback_type = feedback_type
            alert.feedback_note = feedback_note
            alert.feedback_user = feedback_user
            alert.feedback_at = datetime.now()

            feature_json_str = None
            existing_feat = None
            try:
                existing_feat = session.query(FeatureRecord).filter(
                    FeatureRecord.equipment_id == alert.equipment_id,
                    FeatureRecord.window_start <= alert.feature_window_end,
                    FeatureRecord.window_end >= alert.feature_window_start
                ).order_by(desc(FeatureRecord.created_at)).first()
                if existing_feat:
                    feature_json_str = existing_feat.features
            except Exception:
                existing_feat = None

            feature_data = None
            if feature_json_str:
                try:
                    feature_data = json.loads(feature_json_str) if isinstance(feature_json_str, str) else feature_json_str
                except Exception:
                    feature_data = None

            fb_record = FeedbackRecord(
                alert_id=alert_id,
                feedback_type=feedback_type,
                feedback_note=feedback_note,
                feedback_user=feedback_user,
                feature_data=json.dumps(feature_data) if feature_data else None,
                is_used_for_training=False
            )
            session.add(fb_record)
            session.flush()

            if existing_feat is not None:
                existing_feat.label = final_label
                existing_feat.feedback_id = fb_record.id
                if relabel_from and relabel_from != feedback_type:
                    existing_feat.source = FEATURE_SOURCE_RELABELED
                else:
                    existing_feat.source = FEATURE_SOURCE_ENGINEER_CONFIRMED
                existing_feat.confidence_label = float(alert.confidence) if alert.confidence else 1.0
                logger.info(
                    f"[Feedback] 更新 FeatureRecord id={existing_feat.id} "
                    f"source={existing_feat.source} label={final_label} feedback_id={fb_record.id}"
                )
            else:
                if not feature_data and alert.sensor_snapshot:
                    try:
                        snapshot = json.loads(alert.sensor_snapshot) if isinstance(alert.sensor_snapshot, str) else alert.sensor_snapshot
                    except Exception:
                        snapshot = {}
                    if snapshot:
                        import numpy as np
                        import pandas as pd
                        from feature_engineer import FeatureExtractor
                        fe = FeatureExtractor(window_size=max(len(snapshot.get("temperature", [])), 10), step_size=1)
                        sensor_cols = ["temperature", "vibration", "current", "rpm"]
                        data_dict = {}
                        max_len = 0
                        for col in sensor_cols:
                            arr = snapshot.get(col, [])
                            if isinstance(arr, list):
                                data_dict[col] = arr
                                max_len = max(max_len, len(arr))
                            else:
                                data_dict[col] = [float(arr)] * 60
                                max_len = 60
                        if max_len < 10:
                            for col in sensor_cols:
                                data_dict[col] = list(data_dict[col]) + [np.nanmean(data_dict[col]) if len(data_dict[col]) > 0 else 0.0] * (60 - len(data_dict[col]))
                                max_len = 60
                        data_dict["shift"] = [snapshot.get("shift", "早班")] * max_len
                        data_dict["timestamp"] = pd.date_range(
                            start=alert.feature_window_start or alert.timestamp, periods=max_len, freq="min"
                        )
                        tmp_df = pd.DataFrame(data_dict)
                        try:
                            feature_data = fe.extract_window_features(tmp_df, alert.equipment_id, {})
                        except Exception as e:
                            logger.warning(f"[Feedback] 从告警快照构造特征失败: {e}")
                            feature_data = {}

                if feature_data is None:
                    feature_data = {}

                feat_record = FeatureRecord(
                    equipment_id=alert.equipment_id,
                    window_start=alert.feature_window_start,
                    window_end=alert.feature_window_end,
                    features=json.dumps(feature_data),
                    label=final_label,
                    source=FEATURE_SOURCE_RELABELED if (relabel_from and relabel_from != feedback_type) else FEATURE_SOURCE_ENGINEER_CONFIRMED,
                    feedback_id=fb_record.id,
                    confidence_label=float(alert.confidence) if alert.confidence else 1.0,
                    data_version=f"fb_dv_{alert_id}_{fb_record.id}",
                    is_used_for_training=False
                )
                session.add(feat_record)
                logger.info(
                    f"[Feedback] 新建 FeatureRecord source={feat_record.source} "
                    f"label={final_label} equipment_id={alert.equipment_id}"
                )

            if relabel_from and relabel_from != feedback_type:
                relabel_map = FEEDBACK_TO_LABEL
                relabel_record = RelabelRecord(
                    alert_id=alert_id,
                    original_label=relabel_map.get(relabel_from, relabel_from),
                    new_label=relabel_map.get(feedback_type, feedback_type),
                    relabel_reason=feedback_note or "人工改标",
                    relabel_user=feedback_user
                )
                session.add(relabel_record)

            session.commit()
            logger.info(f"Feedback submitted for alert {alert_id}: {feedback_type} by {feedback_user}")
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to submit feedback: {e}")
            raise e
        finally:
            session.close()

    @staticmethod
    def get_feedback_statistics(
        start_time: datetime = None,
        end_time: datetime = None,
        group_by: str = "day"
    ) -> Dict:
        session = Database.get_session()
        try:
            from database import FeedbackRecord

            query = session.query(
                FeedbackRecord.feedback_type,
                FeedbackRecord.created_at
            )
            if start_time:
                query = query.filter(FeedbackRecord.created_at >= start_time)
            if end_time:
                query = query.filter(FeedbackRecord.created_at <= end_time)

            records = query.all()

            type_counts = {
                "REAL_FAULT": 0,
                "SENSOR_DRIFT": 0,
                "FALSE_ALARM": 0
            }
            for r in records:
                if r.feedback_type in type_counts:
                    type_counts[r.feedback_type] += 1

            trends = {}
            for r in records:
                dt = r.created_at
                if group_by == "day":
                    key = dt.strftime("%Y-%m-%d")
                elif group_by == "hour":
                    key = dt.strftime("%Y-%m-%d %H:00")
                else:
                    key = dt.strftime("%Y-%m-%d %H:00")

                if key not in trends:
                    trends[key] = {"REAL_FAULT": 0, "SENSOR_DRIFT": 0, "FALSE_ALARM": 0}
                if r.feedback_type in trends[key]:
                    trends[key][r.feedback_type] += 1

            sorted_trends = dict(sorted(trends.items()))

            total = sum(type_counts.values())
            rates = {}
            for k, v in type_counts.items():
                rates[k] = round(v / total, 4) if total > 0 else 0.0

            return {
                "total_feedback": total,
                "type_counts": type_counts,
                "type_rates": rates,
                "trends": sorted_trends,
                "period_start": start_time.isoformat() if start_time else None,
                "period_end": end_time.isoformat() if end_time else None
            }
        finally:
            session.close()

    @staticmethod
    def get_pending_alerts_count() -> Dict:
        session = Database.get_session()
        try:
            pending_count = session.query(Alert).filter(
                Alert.status == AlertManager.STATUS_PENDING
            ).count()
            by_type = {}
            for atype in ["轴承磨损", "传感器漂移"]:
                by_type[atype] = session.query(Alert).filter(
                    Alert.status == AlertManager.STATUS_PENDING,
                    Alert.alert_type == atype
                ).count()
            return {
                "total_pending": pending_count,
                "by_type": by_type
            }
        finally:
            session.close()
