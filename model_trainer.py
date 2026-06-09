import numpy as np
import pandas as pd
import json
import hashlib
from datetime import datetime, timedelta
from typing import Tuple, Dict, List, Optional
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score
)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.base import clone
from database import (
    Database, FeedbackRecord, Alert, FeatureRecord, DataVersion,
    TRAINING_ALLOWED_SOURCES, FEATURE_SOURCE_AUTO_LABELED,
    FEATURE_SOURCE_ENGINEER_CONFIRMED, FEATURE_SOURCE_RELABELED,
    FEATURE_SOURCE_LABELS, MaintenanceRecord
)
from sqlalchemy import and_, func


class AnomalyModelTrainer:
    LABEL_NORMAL = "正常"
    LABEL_BEARING_WEAR = "轴承磨损"
    LABEL_SENSOR_DRIFT = "传感器漂移"
    MIN_TRAINING_SAMPLES = 15
    MIN_PER_CLASS_RATIO = 0.08

    def __init__(self):
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        self.model = None
        self.pipeline = None
        self._build_label_encoder()
        self.training_audit: Dict = {}

    def _build_label_encoder(self):
        self.label_encoder.fit([
            self.LABEL_NORMAL,
            self.LABEL_BEARING_WEAR,
            self.LABEL_SENSOR_DRIFT
        ])

    def _feedback_type_to_label(self, feedback_type: str) -> str:
        mapping = {
            "REAL_FAULT": self.LABEL_BEARING_WEAR,
            "SENSOR_DRIFT": self.LABEL_SENSOR_DRIFT,
            "FALSE_ALARM": self.LABEL_NORMAL,
        }
        return mapping.get(feedback_type, self.LABEL_NORMAL)

    def _get_maintenance_windows(self, session, equipment_ids: List[str]) -> Dict[str, List[Tuple[datetime, datetime]]]:
        query = session.query(MaintenanceRecord).filter(
            MaintenanceRecord.equipment_id.in_(equipment_ids)
        ) if equipment_ids else session.query(MaintenanceRecord)
        windows: Dict[str, List[Tuple[datetime, datetime]]] = {}
        for m in query.all():
            if m.equipment_id not in windows:
                windows[m.equipment_id] = []
            windows[m.equipment_id].append((m.start_time, m.end_time))
        for eq in windows:
            windows[eq].sort(key=lambda x: x[0])
        return windows

    def _is_within_maintenance_buffer(
        self,
        equipment_id: str,
        window_start: datetime,
        window_end: datetime,
        maintenance_windows: Dict[str, List[Tuple[datetime, datetime]]],
        buffer_hours: int = 24
    ) -> bool:
        if equipment_id not in maintenance_windows:
            return False
        for (m_start, m_end) in maintenance_windows[equipment_id]:
            buffer_start = m_start - timedelta(hours=buffer_hours)
            buffer_end = m_end + timedelta(hours=buffer_hours)
            if (window_start <= buffer_end) and (window_end >= buffer_start):
                return True
        return False

    def load_training_dataset_from_db(
        self,
        include_seed_samples: bool = True,
        start_time: datetime = None,
        end_time: datetime = None,
        exclude_maintenance_buffer_hours: int = 24
    ) -> Tuple[pd.DataFrame, pd.Series, Dict]:
        session = Database.get_session()
        try:
            sources = TRAINING_ALLOWED_SOURCES if include_seed_samples else [
                FEATURE_SOURCE_ENGINEER_CONFIRMED, FEATURE_SOURCE_RELABELED
            ]
            query = session.query(FeatureRecord).filter(
                FeatureRecord.source.in_(sources),
                FeatureRecord.label.isnot(None)
            )
            if start_time:
                query = query.filter(FeatureRecord.window_end >= start_time)
            if end_time:
                query = query.filter(FeatureRecord.window_start <= end_time)

            records = query.all()
            if not records:
                audit = {"total_qualified": 0, "by_source": {}, "by_label": {}, "excluded": {}}
                return pd.DataFrame(), pd.Series(dtype=str), audit

            equipment_ids = list(set([r.equipment_id for r in records]))
            maintenance_windows = self._get_maintenance_windows(session, equipment_ids)

            features_list: List[Dict] = []
            labels_list: List[str] = []
            by_source: Dict[str, int] = {}
            by_label: Dict[str, int] = {}
            by_source_label: Dict[str, Dict[str, int]] = {}
            excluded_maintenance: int = 0
            feature_record_ids: List[int] = []
            feedback_ids_matched: List[int] = []

            for rec in records:
                if exclude_maintenance_buffer_hours > 0 and self._is_within_maintenance_buffer(
                    rec.equipment_id, rec.window_start, rec.window_end,
                    maintenance_windows, buffer_hours=exclude_maintenance_buffer_hours
                ):
                    excluded_maintenance += 1
                    continue

                feat = rec.features
                if isinstance(feat, str):
                    try:
                        feat = json.loads(feat)
                    except Exception:
                        continue
                if not isinstance(feat, dict) or len(feat) == 0:
                    continue

                features_list.append(feat)
                labels_list.append(rec.label)
                feature_record_ids.append(rec.id)
                if rec.feedback_id:
                    feedback_ids_matched.append(rec.feedback_id)

                src = rec.source or "unknown"
                by_source[src] = by_source.get(src, 0) + 1
                lbl = rec.label or "unknown"
                by_label[lbl] = by_label.get(lbl, 0) + 1
                if src not in by_source_label:
                    by_source_label[src] = {}
                by_source_label[src][lbl] = by_source_label[src].get(lbl, 0) + 1

            if not features_list:
                audit = {
                    "total_qualified": 0,
                    "by_source": {},
                    "by_label": {},
                    "by_source_label": {},
                    "excluded": {
                        "maintenance_buffer": excluded_maintenance,
                        "total_considered": len(records),
                    },
                    "feedback_ids": [],
                    "feature_record_ids": [],
                }
                return pd.DataFrame(), pd.Series(dtype=str), audit

            feature_df = pd.DataFrame(features_list)
            label_series = pd.Series(labels_list, name="label")

            audit = {
                "total_qualified": len(features_list),
                "by_source": by_source,
                "by_label": by_label,
                "by_source_label": by_source_label,
                "excluded": {
                    "maintenance_buffer_24h": excluded_maintenance,
                    "total_db_considered": len(records),
                },
                "feedback_ids": feedback_ids_matched,
                "feature_record_ids": feature_record_ids,
                "allowed_sources": sources,
                "maintenance_excluded_hours": exclude_maintenance_buffer_hours,
            }
            self.training_audit = audit

            return feature_df, label_series, audit
        finally:
            session.close()

    def get_training_dataset_summary(self) -> Dict:
        _, _, audit = self.load_training_dataset_from_db(include_seed_samples=True)
        session = Database.get_session()
        try:
            pending_feedback_count = session.query(FeedbackRecord).filter(
                FeedbackRecord.is_used_for_training == False
            ).count()
            all_feedback_count = session.query(FeedbackRecord).count()
            unconfirmed_fr = session.query(FeatureRecord).filter(
                FeatureRecord.source == "historical_unconfirmed"
            ).count()
            total_fr = session.query(FeatureRecord).count()

            source_distribution = dict(
                session.query(FeatureRecord.source, func.count(FeatureRecord.id))
                .group_by(FeatureRecord.source).all()
            )

            label_distribution_confirmed = dict(
                session.query(FeatureRecord.label, func.count(FeatureRecord.id))
                .filter(FeatureRecord.source.in_(TRAINING_ALLOWED_SOURCES))
                .group_by(FeatureRecord.label).all()
            )
        finally:
            session.close()

        return {
            "trainable_summary": audit,
            "feedback_overview": {
                "total": all_feedback_count,
                "pending_for_training": pending_feedback_count,
                "already_used": all_feedback_count - pending_feedback_count,
            },
            "feature_records_overview": {
                "total": total_fr,
                "unconfirmed_only": unconfirmed_fr,
                "eligible_for_training": audit["total_qualified"],
                "by_source": {
                    s: source_distribution.get(s, 0)
                    for s in list(FEATURE_SOURCE_LABELS.keys()) + [None]
                }
            },
            "confirmed_label_distribution": label_distribution_confirmed,
            "status_overview": self._get_training_readiness_status(audit),
        }

    def _get_training_readiness_status(self, audit: Dict) -> Dict:
        total = audit.get("total_qualified", 0)
        by_label = audit.get("by_label", {})
        required = self.MIN_TRAINING_SAMPLES

        class_issues = []
        for cls in self.label_encoder.classes_:
            cnt = by_label.get(cls, 0)
            ratio = cnt / total if total > 0 else 0
            if ratio > 0 and ratio < self.MIN_PER_CLASS_RATIO:
                class_issues.append(f"{cls}占比过低({ratio*100:.1f}%)")

        return {
            "can_train": total >= required and len(class_issues) == 0,
            "total_samples": total,
            "required_samples": required,
            "issues": class_issues,
            "message": (
                f"可训练: {total}/{required} 样本"
                + ("" if not class_issues else "；" + "；".join(class_issues))
            )
        }

    def _generate_and_persist_cold_start_seed_samples(
        self,
        target_count: int,
        data_version: str,
        random_seed: int = None
    ) -> int:
        import numpy as np
        import pandas as pd
        from feature_engineer import FeatureExtractor
        from database import FEATURE_SOURCE_AUTO_LABELED

        seed = random_seed or (int(datetime.now().timestamp()) % 99999)
        rng = np.random.RandomState(seed)
        fe = FeatureExtractor(window_size=60, step_size=10)

        label_weights = {
            "正常": 0.70,
            "轴承磨损": 0.18,
            "传感器漂移": 0.12,
        }
        target_labels = list(label_weights.keys())

        num_per_label = {
            lbl: max(5, int(target_count * label_weights[lbl]))
            for lbl in target_labels
        }
        while sum(num_per_label.values()) < target_count:
            num_per_label["正常"] += 1

        session = Database.get_session()
        try:
            from database import FeatureRecord
            import json as _json

            eq_ids = [f"EQ_{i:02d}" for i in range(1, 6)]
            base_time = datetime.now() - timedelta(days=15)

            feature_blueprint = None
            for attempt in range(3):
                try:
                    snapshot = self._generate_labeled_sensor_snapshot("正常", rng)
                    df_window = self._snapshot_to_window_df(snapshot, base_time, rng)
                    feat_dict = fe.extract_window_features(df_window, "EQ_SEED", {})
                    if feat_dict and isinstance(feat_dict, dict) and len(feat_dict) > 50:
                        feature_blueprint = feat_dict
                        break
                except Exception:
                    continue

            if feature_blueprint is None:
                return 0

            feat_keys = list(feature_blueprint.keys())
            records_to_insert = []
            feat_count = 0

            for lbl in target_labels:
                n_needed = num_per_label[lbl]
                for _ in range(n_needed):
                    try:
                        snapshot = self._generate_labeled_sensor_snapshot(lbl, rng)
                        df_window = self._snapshot_to_window_df(
                            snapshot,
                            base_time + timedelta(hours=feat_count * 2),
                            rng
                        )
                        try:
                            feat_dict = fe.extract_window_features(
                                df_window,
                                rng.choice(eq_ids),
                                {}
                            )
                            if not feat_dict or len(feat_dict) < len(feat_keys) // 2:
                                raise ValueError("feat dict broken")
                        except Exception:
                            feat_dict = {}
                            for k in feat_keys:
                                base_val = float(feature_blueprint[k] or 0.0)
                                noise = base_val * (0.85 + rng.rand() * 0.3)
                                if lbl != "正常":
                                    noise *= (1.05 + rng.rand() * 0.4)
                                feat_dict[k] = float(noise)

                        start_time = base_time + timedelta(
                            hours=feat_count * 2, minutes=int(rng.randint(0, 59))
                        )
                        end_time = start_time + timedelta(minutes=60)

                        fr = FeatureRecord(
                            equipment_id=rng.choice(eq_ids),
                            window_start=start_time,
                            window_end=end_time,
                            features=_json.dumps(feat_dict, ensure_ascii=False),
                            label=lbl,
                            source=FEATURE_SOURCE_AUTO_LABELED,
                            feedback_id=None,
                            confidence_label=float(0.6 + rng.rand() * 0.3),
                            data_version=data_version,
                            is_used_for_training=False
                        )
                        records_to_insert.append(fr)
                        feat_count += 1
                    except Exception:
                        continue

            for i in range(0, len(records_to_insert), 500):
                batch = records_to_insert[i:i + 500]
                session.add_all(batch)
                session.commit()

            print(
                f"[ColdStartSeed] 生成并入库 {len(records_to_insert)} 条冷启动种子样本 "
                f"(source={FEATURE_SOURCE_AUTO_LABELED}, 分布={num_per_label})"
            )
            return len(records_to_insert)
        except Exception as e:
            session.rollback()
            print(f"[ColdStartSeed] 冷启动种子样本生成失败: {e}")
            import traceback
            traceback.print_exc()
            return 0
        finally:
            session.close()

    @staticmethod
    def _generate_labeled_sensor_snapshot(
        label: str,
        rng: np.random.RandomState
    ) -> Dict[str, np.ndarray]:
        n = 60
        snapshot = {
            "temperature": rng.normal(55, 5, n),
            "vibration": rng.normal(2.0, 0.5, n),
            "current": rng.normal(20, 2, n),
            "rpm": rng.normal(1500, 60, n),
            "shift": ["早班"] * n,
        }
        if label == "轴承磨损":
            snapshot["vibration"] = np.clip(
                np.linspace(3.0, 7.0, n) + rng.normal(0, 0.8, n), 0.5, None
            )
            snapshot["temperature"] = np.clip(
                rng.normal(55, 5, n) + np.linspace(0, 18, n), 40, 95
            )
            snapshot["current"] = rng.normal(22, 3, n)
        elif label == "传感器漂移":
            drift_direction = rng.choice([-1.0, 1.0])
            drift_magnitude = rng.uniform(8, 22)
            drift_series = np.linspace(0, drift_direction * drift_magnitude, n)
            drift_col = rng.choice(["temperature", "current", "rpm"])
            snapshot[drift_col] = snapshot[drift_col] + drift_series
            snapshot["vibration"] = np.clip(
                snapshot["vibration"] + rng.normal(0, 0.6, n), 0.1, None
            )
        return snapshot

    @staticmethod
    def _snapshot_to_window_df(
        snapshot: Dict[str, np.ndarray],
        start_ts: datetime,
        rng: np.random.RandomState
    ) -> pd.DataFrame:
        import pandas as _pd
        n = len(snapshot["temperature"])
        timestamps = _pd.date_range(start=start_ts, periods=n, freq="min")
        return _pd.DataFrame({
            "timestamp": timestamps,
            "temperature": snapshot["temperature"],
            "vibration": snapshot["vibration"],
            "current": snapshot["current"],
            "rpm": snapshot["rpm"],
            "shift": snapshot["shift"],
        })

    def _build_model_pipeline(self, model_type: str = "gb") -> Pipeline:
        if model_type == "rf":
            classifier = RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight="balanced_subsample",
                random_state=42,
                n_jobs=-1
            )
        else:
            classifier = GradientBoostingClassifier(
                n_estimators=150,
                max_depth=5,
                learning_rate=0.08,
                subsample=0.85,
                min_samples_split=5,
                min_samples_leaf=3,
                random_state=42
            )

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", Pipeline([
                    ("imputer", SimpleImputer(strategy="median")),
                    ("scaler", StandardScaler())
                ]), self.feature_names)
            ]
        )

        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", classifier)
        ])

        return pipeline

    def _evaluate_model(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_proba: np.ndarray,
        labels: List[str]
    ) -> Dict:
        accuracy = accuracy_score(y_true, y_pred)

        precision_macro = precision_score(y_true, y_pred, average="macro", zero_division=0)
        recall_macro = recall_score(y_true, y_pred, average="macro", zero_division=0)
        f1_macro = f1_score(y_true, y_pred, average="macro", zero_division=0)

        precision_weighted = precision_score(y_true, y_pred, average="weighted", zero_division=0)
        recall_weighted = recall_score(y_true, y_pred, average="weighted", zero_division=0)
        f1_weighted = f1_score(y_true, y_pred, average="weighted", zero_division=0)

        precision_per_class = {}
        recall_per_class = {}
        f1_per_class = {}
        try:
            precision_scores = precision_score(y_true, y_pred, average=None, zero_division=0)
            recall_scores = recall_score(y_true, y_pred, average=None, zero_division=0)
            f1_scores = f1_score(y_true, y_pred, average=None, zero_division=0)
            for i, label in enumerate(labels):
                if i < len(precision_scores):
                    precision_per_class[label] = float(precision_scores[i])
                    recall_per_class[label] = float(recall_scores[i])
                    f1_per_class[label] = float(f1_scores[i])
        except Exception:
            for label in labels:
                precision_per_class[label] = 0.0
                recall_per_class[label] = 0.0
                f1_per_class[label] = 0.0

        try:
            if y_proba is not None and y_proba.shape[1] > 2:
                roc_auc = roc_auc_score(y_true, y_proba, multi_class="ovr", average="macro")
            elif y_proba is not None:
                roc_auc = roc_auc_score(y_true, y_proba[:, 1])
            else:
                roc_auc = 0.0
        except Exception:
            roc_auc = 0.0

        try:
            cm = confusion_matrix(y_true, y_pred, labels=list(range(len(labels))))
            cm_dict = {labels[i]: {labels[j]: int(cm[i][j]) for j in range(len(labels))} for i in range(len(labels))}
        except Exception:
            cm_dict = {}

        return {
            "accuracy": float(accuracy),
            "precision": float(precision_macro),
            "recall": float(recall_macro),
            "f1": float(f1_macro),
            "precision_macro": float(precision_macro),
            "recall_macro": float(recall_macro),
            "f1_macro": float(f1_macro),
            "precision_weighted": float(precision_weighted),
            "recall_weighted": float(recall_weighted),
            "f1_weighted": float(f1_weighted),
            "roc_auc": float(roc_auc),
            "precision_per_class": precision_per_class,
            "recall_per_class": recall_per_class,
            "f1_per_class": f1_per_class,
            "per_class_precision_recall_f1": {
                label: {
                    "precision": precision_per_class.get(label, 0.0),
                    "recall": recall_per_class.get(label, 0.0),
                    "f1": f1_per_class.get(label, 0.0)
                } for label in labels
            },
            "confusion_matrix": cm_dict,
            "classification_report": classification_report(
                y_true, y_pred, target_names=labels, zero_division=0
            )
        }

    def _collect_engineer_confirmed_feedback(
        self,
        data_version: str,
        used_feedback_ids: List[int]
    ) -> Tuple[List[Dict], List[str], List[int]]:
        session = Database.get_session()
        try:
            feedbacks = session.query(FeedbackRecord).filter(
                FeedbackRecord.is_used_for_training == False
            ).all()

            new_features: List[Dict] = []
            new_labels: List[str] = []
            new_fb_ids: List[int] = []
            processed_ids: List[int] = []

            for fb in feedbacks:
                if fb.id in used_feedback_ids:
                    continue
                feature_data = fb.feature_data
                if isinstance(feature_data, str):
                    try:
                        feature_data = json.loads(feature_data)
                    except Exception:
                        feature_data = None
                if not feature_data or not isinstance(feature_data, dict):
                    continue

                label = self._feedback_type_to_label(fb.feedback_type)
                new_features.append(feature_data)
                new_labels.append(label)
                new_fb_ids.append(fb.id)
                processed_ids.append(fb.id)

            if new_features:
                for fid in processed_ids:
                    fb_rec = session.query(FeedbackRecord).filter(FeedbackRecord.id == fid).first()
                    if fb_rec:
                        fb_rec.is_used_for_training = True
                        fb_rec.training_data_version = data_version
                session.commit()

            return new_features, new_labels, processed_ids
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def _upsert_feature_records_for_feedback(
        self,
        feature_label_list: List[Tuple[Dict, str, int]],
        source: str,
    ) -> List[int]:
        if not feature_label_list:
            return []
        session = Database.get_session()
        created_ids: List[int] = []
        try:
            now = datetime.now()
            for (feat, label, fb_id) in feature_label_list:
                fb = session.query(FeedbackRecord).filter(FeedbackRecord.id == fb_id).first()
                if not fb:
                    continue
                alert = session.query(Alert).filter(Alert.id == fb.alert_id).first()
                if not alert:
                    continue

                existing = session.query(FeatureRecord).filter(
                    FeatureRecord.feedback_id == fb_id
                ).first()

                if existing:
                    existing.label = label
                    existing.source = FEATURE_SOURCE_RELABELED if existing.source in TRAINING_ALLOWED_SOURCES else source
                    existing.confidence_label = 1.0
                    existing.features = json.dumps(feat, ensure_ascii=False)
                else:
                    new_fr = FeatureRecord(
                        equipment_id=alert.equipment_id,
                        window_start=alert.feature_window_start or (now - timedelta(hours=1)),
                        window_end=alert.feature_window_end or now,
                        features=json.dumps(feat, ensure_ascii=False),
                        label=label,
                        source=source,
                        feedback_id=fb_id,
                        confidence_label=1.0
                    )
                    session.add(new_fr)
                    session.flush()
                    created_ids.append(new_fr.id)
            session.commit()
            return created_ids
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def train(
        self,
        feature_df: pd.DataFrame = None,
        label_series: pd.Series = None,
        model_type: str = "gb",
        test_size: float = 0.2,
        random_state: int = 42,
        include_feedback: bool = True,
        description: str = "",
        include_seed_samples: bool = True,
        auto_seed_samples: bool = None,
        exclude_maintenance_buffer_hours: int = 24,
        strict_from_db_only: bool = True
    ) -> Dict:
        data_hash = hashlib.md5(
            f"{datetime.now().isoformat()}_{np.random.randint(0, 999999)}".encode()
        ).hexdigest()[:10]
        data_version = f"dv_{datetime.now().strftime('%Y%m%d')}_{data_hash}"

        if auto_seed_samples is not None:
            include_seed_samples = bool(auto_seed_samples)

        if strict_from_db_only or feature_df is None or label_series is None:
            feature_df, label_series, audit_db = self.load_training_dataset_from_db(
                include_seed_samples=include_seed_samples,
                exclude_maintenance_buffer_hours=exclude_maintenance_buffer_hours
            )
        else:
            audit_db = {"total_qualified": len(feature_df), "external": True}

        seed_samples_generated = 0
        if include_seed_samples and audit_db.get("total_qualified", 0) < self.MIN_TRAINING_SAMPLES:
            existing_count = audit_db.get("total_qualified", 0)
            seed_target = max(self.MIN_TRAINING_SAMPLES - existing_count, 30)
            seed_samples_generated = self._generate_and_persist_cold_start_seed_samples(
                seed_target, data_version
            )
            if seed_samples_generated > 0:
                feature_df, label_series, audit_db = self.load_training_dataset_from_db(
                    include_seed_samples=True,
                    exclude_maintenance_buffer_hours=exclude_maintenance_buffer_hours
                )

        initial_ids = list(audit_db.get("feedback_ids", []))
        extra_feedback_ids = []

        if include_feedback:
            extra_feats, extra_labels, extra_fb_ids = self._collect_engineer_confirmed_feedback(
                data_version, initial_ids
            )
            extra_feedback_ids = extra_fb_ids
            if extra_feats:
                upsert_list = [
                    (extra_feats[i], extra_labels[i], extra_fb_ids[i])
                    for i in range(len(extra_feats))
                ]
                self._upsert_feature_records_for_feedback(
                    upsert_list, source=FEATURE_SOURCE_ENGINEER_CONFIRMED
                )

                extra_df = pd.DataFrame(extra_feats)
                if feature_df.empty:
                    feature_df = extra_df
                    label_series = pd.Series(extra_labels, dtype=str)
                else:
                    common_cols = list(feature_df.columns.intersection(extra_df.columns))
                    if len(common_cols) < 10:
                        common_cols = list(feature_df.columns)
                        for c in common_cols:
                            if c not in extra_df.columns:
                                extra_df[c] = 0.0
                    feature_df = pd.concat(
                        [feature_df[common_cols].reset_index(drop=True),
                         extra_df[common_cols].reset_index(drop=True)],
                        ignore_index=True
                    )
                    label_series = pd.concat(
                        [label_series.reset_index(drop=True),
                         pd.Series(extra_labels, dtype=str).reset_index(drop=True)],
                        ignore_index=True
                    )
                audit_db = self.get_training_dataset_summary()["trainable_summary"]

        if feature_df.empty or len(feature_df) < self.MIN_TRAINING_SAMPLES:
            status = self._get_training_readiness_status(audit_db)
            raise ValueError(
                f"训练数据不足。当前状态: {status['message']}。"
                f"需要至少 {self.MIN_TRAINING_SAMPLES} 条工程师确认样本。"
                f"请先在「告警管理」中进行人工确认。"
            )

        valid_mask = label_series.isin(list(self.label_encoder.classes_))
        feature_df = feature_df[valid_mask].reset_index(drop=True)
        label_series = label_series[valid_mask].reset_index(drop=True)

        class_counts = label_series.value_counts()
        for cls in self.label_encoder.classes_:
            if cls not in class_counts or class_counts[cls] / len(label_series) < self.MIN_PER_CLASS_RATIO:
                pass

        self.feature_names = list(feature_df.columns)
        feature_df = feature_df[self.feature_names]

        X = feature_df.values
        y = self.label_encoder.transform(label_series)

        class_counts_dict = class_counts.to_dict()

        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=min(test_size, 0.35), random_state=random_state, stratify=y
            )
        except ValueError:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )

        train_df = pd.DataFrame(X_train, columns=self.feature_names)
        test_df = pd.DataFrame(X_test, columns=self.feature_names)

        self.pipeline = self._build_model_pipeline(model_type)
        self.pipeline.fit(train_df, y_train)

        y_pred_train = self.pipeline.predict(train_df)
        y_proba_train = self.pipeline.predict_proba(train_df)
        train_metrics = self._evaluate_model(
            y_train, y_pred_train, y_proba_train,
            list(self.label_encoder.classes_)
        )

        y_pred_test = self.pipeline.predict(test_df)
        y_proba_test = self.pipeline.predict_proba(test_df)
        test_metrics = self._evaluate_model(
            y_test, y_pred_test, y_proba_test,
            list(self.label_encoder.classes_)
        )

        cv_result = {"cv_f1_macro_mean": 0.0, "cv_f1_macro_std": 0.0, "cv_scores": []}
        try:
            if len(X) >= 30:
                cv_scores = cross_val_score(
                    clone(self.pipeline),
                    pd.DataFrame(X, columns=self.feature_names),
                    y,
                    cv=min(5, max(2, len(X) // 20)),
                    scoring="f1_macro",
                    n_jobs=-1
                )
                cv_result = {
                    "cv_f1_macro_mean": float(np.mean(cv_scores)),
                    "cv_f1_macro_std": float(np.std(cv_scores)),
                    "cv_scores": [float(s) for s in cv_scores]
                }
        except Exception:
            pass

        model_version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        all_used_fb_ids = list(set(initial_ids + extra_feedback_ids))

        dataset_info = {
            "total_samples": int(len(feature_df)),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "feature_count": int(len(self.feature_names)),
            "class_distribution": class_counts_dict,
            "used_feedback_count": int(len(all_used_fb_ids)),
            "used_feedback_ids": all_used_fb_ids,
            "sample_source_audit": audit_db,
            "maintenance_excluded_hours": exclude_maintenance_buffer_hours,
            "strict_training_rule": "仅使用工程师人工确认样本+冷启动种子样本，历史raw_label未直接参与训练",
            "strict_training_rule_enabled": True,
            "seed_samples_generated": int(seed_samples_generated),
            "total_allowed_from_db": int(audit_db.get("total_qualified", 0)),
            "by_source_in_training": audit_db.get("by_source", {}),
            "by_label_in_training": audit_db.get("by_label", {}),
            "excluded_maintenance_buffer_count": int(
                (audit_db.get("excluded") or {}).get("maintenance_buffer_24h", 0)
            ),
            "training_allowed_sources": list(TRAINING_ALLOWED_SOURCES),
            "excluded_sources_note": "historical_unconfirmed 来源(原始传感器raw_label)一律排除"
        }

        result = {
            "model_type": model_type,
            "model_version": model_version,
            "data_version": data_version,
            "description": description,
            "dataset_info": dataset_info,
            "train_metrics": train_metrics,
            "test_metrics": test_metrics,
            "cv_metrics": cv_result,
            "feature_names": self.feature_names,
            "label_classes": list(self.label_encoder.classes_),
            "timestamp": datetime.now().isoformat()
        }

        self._save_data_version(data_version, feature_df, label_series, all_used_fb_ids, result)

        return result

    def _save_data_version(
        self,
        version: str,
        feature_df: pd.DataFrame,
        label_series: pd.Series,
        feedback_ids: List[int],
        training_result: Dict
    ):
        session = Database.get_session()
        try:
            positive_count = int((label_series != self.LABEL_NORMAL).sum())
            dv = DataVersion(
                version=version,
                description=training_result.get("description", ""),
                record_count=len(feature_df),
                positive_count=positive_count,
                feature_count=len(self.feature_names),
                included_feedback_ids=feedback_ids,
                created_by="engineer_training_pipeline"
            )
            session.add(dv)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def predict(self, features: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        if self.pipeline is None:
            raise ValueError("模型尚未训练，请先调用 train() 方法")

        feature_df = pd.DataFrame(features)
        missing_cols = [c for c in self.feature_names if c not in feature_df.columns]
        for col in missing_cols:
            feature_df[col] = 0.0
        feature_df = feature_df[self.feature_names].fillna(0)

        y_pred = self.pipeline.predict(feature_df)
        y_proba = self.pipeline.predict_proba(feature_df)

        labels = self.label_encoder.inverse_transform(y_pred.astype(int))
        return labels, y_proba

    def predict_single(self, features: Dict) -> Tuple[str, Dict[str, float]]:
        labels, proba = self.predict([features])
        proba_dict = {}
        for i, cls in enumerate(self.label_encoder.classes_):
            proba_dict[cls] = float(proba[0][i])
        return labels[0], proba_dict

    def get_feature_importance(self) -> Dict[str, float]:
        if self.pipeline is None:
            return {}

        classifier = self.pipeline.named_steps["classifier"]
        if hasattr(classifier, "feature_importances_"):
            importances = classifier.feature_importances_
            return {name: float(imp) for name, imp in zip(self.feature_names, importances)}
        return {}
