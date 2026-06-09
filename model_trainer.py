import numpy as np
import pandas as pd
import json
import hashlib
from datetime import datetime
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
from database import Database, FeedbackRecord, Alert, FeatureRecord, DataVersion
from sqlalchemy import and_


class AnomalyModelTrainer:
    LABEL_NORMAL = "正常"
    LABEL_BEARING_WEAR = "轴承磨损"
    LABEL_SENSOR_DRIFT = "传感器漂移"

    def __init__(self):
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        self.model = None
        self.pipeline = None
        self._build_label_encoder()

    def _build_label_encoder(self):
        self.label_encoder.fit([
            self.LABEL_NORMAL,
            self.LABEL_BEARING_WEAR,
            self.LABEL_SENSOR_DRIFT
        ])

    def _load_training_data_from_db(
        self,
        start_time: datetime = None,
        end_time: datetime = None,
        equipment_id: str = None
    ) -> Tuple[pd.DataFrame, pd.Series]:
        session = Database.get_session()
        try:
            query = session.query(FeatureRecord)
            filters = []
            if start_time:
                filters.append(FeatureRecord.window_end >= start_time)
            if end_time:
                filters.append(FeatureRecord.window_start <= end_time)
            if equipment_id:
                filters.append(FeatureRecord.equipment_id == equipment_id)
            if filters:
                query = query.filter(and_(*filters))

            records = query.all()
            if not records:
                return pd.DataFrame(), pd.Series()

            data = []
            labels = []
            for rec in records:
                features = json.loads(rec.features) if isinstance(rec.features, str) else rec.features
                data.append(features)
                labels.append(rec.data_version)

            feature_df = pd.DataFrame(data)
            session2 = Database.get_session()
            try:
                sensor_query = """
                    SELECT sr.equipment_id, sr.timestamp, sr.raw_label, 
                           fr.id as feature_id, fr.window_start, fr.window_end
                    FROM feature_records fr
                    JOIN sensor_readings sr ON sr.equipment_id = fr.equipment_id
                        AND sr.timestamp BETWEEN fr.window_start AND fr.window_end
                    WHERE sr.is_downtime = FALSE AND sr.raw_label IS NOT NULL
                """
                label_df = pd.read_sql(sensor_query, session2.bind)

                if not label_df.empty:
                    label_map = {}
                    for _, row in label_df.iterrows():
                        start = row["window_start"]
                        end = row["window_end"]
                        labels_in_window = label_df[
                            (label_df["window_start"] == start) &
                            (label_df["window_end"] == end)
                        ]["raw_label"]
                        if len(labels_in_window) > 0:
                            label_counts = labels_in_window.value_counts()
                            majority_label = label_counts.index[0]
                            key = f"{row['equipment_id']}_{start}_{end}"
                            label_map[key] = majority_label

                    final_labels = []
                    for rec in records:
                        key = f"{rec.equipment_id}_{rec.window_start}_{rec.window_end}"
                        final_labels.append(label_map.get(key, self.LABEL_NORMAL))
                    label_series = pd.Series(final_labels)
                else:
                    label_series = pd.Series([self.LABEL_NORMAL] * len(records))
            finally:
                session2.close()

            return feature_df, label_series
        finally:
            session.close()

    def _include_confirmed_feedback(
        self,
        feature_df: pd.DataFrame,
        label_series: pd.Series,
        data_version: str
    ) -> Tuple[pd.DataFrame, pd.Series, List[int]]:
        session = Database.get_session()
        try:
            feedbacks = session.query(FeedbackRecord).filter(
                FeedbackRecord.is_used_for_training == False
            ).all()

            new_features = []
            new_labels = []
            used_feedback_ids = []

            for fb in feedbacks:
                alert = session.query(Alert).filter(Alert.id == fb.alert_id).first()
                if not alert:
                    continue

                feature_data = fb.feature_data
                if isinstance(feature_data, str):
                    feature_data = json.loads(feature_data)
                if not feature_data:
                    continue

                if fb.feedback_type == "REAL_FAULT":
                    label = self.LABEL_BEARING_WEAR
                elif fb.feedback_type == "SENSOR_DRIFT":
                    label = self.LABEL_SENSOR_DRIFT
                else:
                    label = self.LABEL_NORMAL

                new_features.append(feature_data)
                new_labels.append(label)
                used_feedback_ids.append(fb.id)

            if new_features:
                new_df = pd.DataFrame(new_features)
                common_cols = feature_df.columns.intersection(new_df.columns) if len(feature_df) > 0 else new_df.columns
                if len(feature_df) > 0:
                    feature_df = pd.concat([feature_df[common_cols], new_df[common_cols]], ignore_index=True)
                else:
                    feature_df = new_df[common_cols]
                label_series = pd.concat([label_series, pd.Series(new_labels)], ignore_index=True)

                for fid in used_feedback_ids:
                    fb_rec = session.query(FeedbackRecord).filter(FeedbackRecord.id == fid).first()
                    if fb_rec:
                        fb_rec.is_used_for_training = True
                        fb_rec.training_data_version = data_version
                session.commit()

            return feature_df, label_series, used_feedback_ids
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

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
        precision_scores = precision_score(y_true, y_pred, average=None, zero_division=0)
        recall_scores = recall_score(y_true, y_pred, average=None, zero_division=0)
        f1_scores = f1_score(y_true, y_pred, average=None, zero_division=0)
        for i, label in enumerate(labels):
            if i < len(precision_scores):
                precision_per_class[label] = float(precision_scores[i])
                recall_per_class[label] = float(recall_scores[i])
                f1_per_class[label] = float(f1_scores[i])

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
            cm = confusion_matrix(y_true, y_pred)
            cm_dict = {labels[i]: {labels[j]: int(cm[i][j]) for j in range(len(labels))} for i in range(len(labels))}
        except Exception:
            cm_dict = {}

        return {
            "accuracy": float(accuracy),
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
            "confusion_matrix": cm_dict,
            "classification_report": classification_report(
                y_true, y_pred, target_names=labels, zero_division=0
            )
        }

    def train(
        self,
        feature_df: pd.DataFrame = None,
        label_series: pd.Series = None,
        model_type: str = "gb",
        test_size: float = 0.2,
        random_state: int = 42,
        include_feedback: bool = True,
        description: str = ""
    ) -> Dict:
        if feature_df is None or label_series is None:
            feature_df, label_series = self._load_training_data_from_db()

        data_hash = hashlib.md5(
            f"{len(feature_df)}_{datetime.now().isoformat()}".encode()
        ).hexdigest()[:10]
        data_version = f"dv_{datetime.now().strftime('%Y%m%d')}_{data_hash}"

        if include_feedback:
            feature_df, label_series, used_feedback_ids = self._include_confirmed_feedback(
                feature_df, label_series, data_version
            )
        else:
            used_feedback_ids = []

        if feature_df.empty or len(feature_df) < 10:
            raise ValueError("训练数据不足，至少需要10个样本")

        valid_mask = label_series.isin(self.label_encoder.classes_)
        feature_df = feature_df[valid_mask].reset_index(drop=True)
        label_series = label_series[valid_mask].reset_index(drop=True)

        self.feature_names = list(feature_df.columns)
        feature_df = feature_df[self.feature_names]

        X = feature_df.values
        y = self.label_encoder.transform(label_series)

        class_counts = pd.Series(label_series).value_counts().to_dict()

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
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

        try:
            cv_scores = cross_val_score(
                clone(self.pipeline),
                pd.DataFrame(X, columns=self.feature_names),
                y,
                cv=5,
                scoring="f1_macro",
                n_jobs=-1
            )
            cv_result = {
                "cv_f1_macro_mean": float(np.mean(cv_scores)),
                "cv_f1_macro_std": float(np.std(cv_scores)),
                "cv_scores": [float(s) for s in cv_scores]
            }
        except Exception:
            cv_result = {"cv_f1_macro_mean": 0.0, "cv_f1_macro_std": 0.0, "cv_scores": []}

        model_version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        result = {
            "model_type": model_type,
            "model_version": model_version,
            "data_version": data_version,
            "description": description,
            "dataset_info": {
                "total_samples": int(len(feature_df)),
                "train_samples": int(len(X_train)),
                "test_samples": int(len(X_test)),
                "feature_count": int(len(self.feature_names)),
                "class_distribution": class_counts,
                "used_feedback_count": int(len(used_feedback_ids)),
                "used_feedback_ids": used_feedback_ids
            },
            "train_metrics": train_metrics,
            "test_metrics": test_metrics,
            "cv_metrics": cv_result,
            "feature_names": self.feature_names,
            "label_classes": list(self.label_encoder.classes_),
            "timestamp": datetime.now().isoformat()
        }

        self._save_data_version(data_version, feature_df, label_series, used_feedback_ids, result)

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
                created_by="system"
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

        labels = self.label_encoder.inverse_transform(y_pred)
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
