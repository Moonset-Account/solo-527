import lightgbm as lgb
import pandas as pd
import numpy as np
import joblib
import json
import os
import shutil
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score,
    recall_score, f1_score, confusion_matrix
)
from scipy.stats import ks_2samp
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    shap = None
    SHAP_AVAILABLE = False
from app.core.config import settings
from app.ml.feature_engineer import FeatureEngineer


class LightGBMTrainer:
    DEFAULT_PARAMS = {
        "objective": "binary",
        "metric": "auc",
        "boosting_type": "gbdt",
        "num_leaves": 63,
        "learning_rate": 0.05,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": -1,
        "min_child_samples": 20,
        "max_depth": 8,
        "reg_alpha": 0.1,
        "reg_lambda": 0.1,
        "random_state": 42,
        "n_estimators": 500,
    }

    def __init__(self, model_storage_path: Optional[str] = None):
        self.storage_path = model_storage_path or settings.MODEL_STORAGE_PATH
        os.makedirs(self.storage_path, exist_ok=True)
        self.model = None
        self.explainer = None
        self.feature_names = []
        self.version_info = {}

    def _version_dir(self, version: str) -> str:
        version_str = str(version) if version is not None else ""
        prefix = "" if (version_str.startswith("v") or version_str.startswith("V")) else "v"
        return os.path.join(self.storage_path, f"{prefix}{version_str}")

    def train(
        self,
        features_df: pd.DataFrame,
        labels: pd.Series,
        version: str,
        hyperparams: Optional[Dict[str, Any]] = None,
        test_size: float = 0.2,
        random_state: int = 42,
        description: Optional[str] = None,
        date_range: Optional[Tuple[datetime, datetime]] = None,
    ) -> Dict[str, Any]:
        valid_mask = labels.notna()
        X = features_df[valid_mask].copy()
        y = labels[valid_mask].copy()

        if "appointment_id" in X.columns:
            X = X.drop(columns=["appointment_id"])

        self.feature_names = list(X.columns)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )

        params = self.DEFAULT_PARAMS.copy()
        if hyperparams:
            params.update(hyperparams)

        train_data = lgb.Dataset(X_train, label=y_train, feature_name=self.feature_names)
        valid_data = lgb.Dataset(X_test, label=y_test, feature_name=self.feature_names, reference=train_data)

        callbacks = [
            lgb.early_stopping(stopping_rounds=50),
        ]

        self.model = lgb.train(
            params,
            train_data,
            valid_sets=[valid_data],
            callbacks=callbacks,
        )

        metrics = self._evaluate(X_test, y_test)
        feature_importance = self._get_feature_importance()

        version_dir = self._version_dir(version)
        os.makedirs(version_dir, exist_ok=True)

        model_path = os.path.join(version_dir, "model.lgb")
        self.model.save_model(model_path)

        explainer_path = os.path.join(version_dir, "explainer.joblib")
        try:
            if SHAP_AVAILABLE and shap is not None:
                background_data = shap.sample(X_train, 100) if len(X_train) > 100 else X_train
                self.explainer = shap.TreeExplainer(self.model, background_data)
                joblib.dump(self.explainer, explainer_path)
            else:
                explainer_path = None
        except Exception as e:
            print(f"Warning: Failed to create SHAP explainer: {e}")
            explainer_path = None

        metadata = {
            "version": version,
            "model_name": "LightGBM",
            "description": description,
            "created_at": datetime.utcnow().isoformat(),
            "training_sample_count": int(len(X_train)),
            "test_sample_count": int(len(X_test)),
            "test_size": test_size,
            "random_state": random_state,
            "hyperparameters": params,
            "feature_columns": self.feature_names,
            "metrics": metrics,
            "feature_importance": feature_importance,
            "model_file_path": model_path,
            "explainer_path": explainer_path,
            "training_date_range_start": date_range[0].isoformat() if date_range else None,
            "training_date_range_end": date_range[1].isoformat() if date_range else None,
        }

        meta_path = os.path.join(version_dir, "metadata.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2, default=str)

        fi_path = os.path.join(version_dir, "feature_importance.json")
        with open(fi_path, "w", encoding="utf-8") as f:
            json.dump(feature_importance, f, ensure_ascii=False, indent=2, default=str)

        self.version_info = metadata
        return metadata

    def _evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
        y_pred_proba = self.model.predict(X_test, num_iteration=self.model.best_iteration)
        y_pred = (y_pred_proba >= 0.5).astype(int)

        try:
            auc = float(roc_auc_score(y_test, y_pred_proba))
        except Exception:
            auc = None

        try:
            pos_scores = y_pred_proba[y_test == 1]
            neg_scores = y_pred_proba[y_test == 0]
            if len(pos_scores) > 0 and len(neg_scores) > 0:
                ks_stat, _ = ks_2samp(pos_scores, neg_scores)
                ks = float(ks_stat)
            else:
                ks = None
        except Exception:
            ks = None

        metrics = {
            "auc": auc,
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, zero_division=0)),
            "f1": float(f1_score(y_test, y_pred, zero_division=0)),
            "ks": ks,
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
            "best_iteration": int(self.model.best_iteration),
            "thresholds": {
                "low": 0.2,
                "medium": 0.5,
                "high": 0.8,
            },
        }
        return metrics

    def _get_feature_importance(self) -> List[Dict[str, Any]]:
        importance_gain = self.model.feature_importance(importance_type="gain")
        importance_split = self.model.feature_importance(importance_type="split")
        total_gain = importance_gain.sum() or 1

        fi = []
        for i, name in enumerate(self.feature_names):
            fi.append({
                "feature": name,
                "importance_gain": float(importance_gain[i]),
                "importance_split": int(importance_split[i]),
                "importance_ratio": float(importance_gain[i] / total_gain * 100),
            })
        fi.sort(key=lambda x: x["importance_gain"], reverse=True)
        return fi

    def load_model(self, version: str) -> bool:
        version_dir = self._version_dir(version)
        model_path = os.path.join(version_dir, "model.lgb")
        meta_path = os.path.join(version_dir, "metadata.json")
        explainer_path = os.path.join(version_dir, "explainer.joblib")

        if not os.path.exists(model_path) or not os.path.exists(meta_path):
            return False

        try:
            self.model = lgb.Booster(model_file=model_path)
            self.feature_names = list(self.model.feature_name())

            with open(meta_path, "r", encoding="utf-8") as f:
                self.version_info = json.load(f)

            if os.path.exists(explainer_path):
                try:
                    self.explainer = joblib.load(explainer_path)
                except Exception:
                    self.explainer = None
            else:
                self.explainer = None

            return True
        except Exception as e:
            print(f"Error loading model version {version}: {e}")
            return False

    def list_versions(self) -> List[Dict[str, Any]]:
        versions = []
        if not os.path.exists(self.storage_path):
            return versions
        for entry in sorted(os.listdir(self.storage_path), reverse=True):
            entry_path = os.path.join(self.storage_path, entry)
            meta_path = os.path.join(entry_path, "metadata.json")
            if os.path.isdir(entry_path) and entry.startswith("v") and os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    versions.append({
                        "version": meta.get("version", entry[1:]),
                        "model_name": meta.get("model_name", "LightGBM"),
                        "description": meta.get("description"),
                        "created_at": meta.get("created_at"),
                        "training_sample_count": meta.get("training_sample_count", 0),
                        "metrics": meta.get("metrics", {}),
                        "is_active": False,
                    })
                except Exception:
                    pass
        return versions

    def delete_version(self, version: str) -> bool:
        version_dir = self._version_dir(version)
        if os.path.exists(version_dir):
            shutil.rmtree(version_dir)
            return True
        return False

    def rollback_version(self, from_version: str, to_version: str) -> bool:
        """严格模式：to_dir(目标版本模型目录)必须存在且可加载，才能回滚成功。
        from_dir(源版本)不存在不阻断（因为可能是临时版本被清理）。"""
        from_dir = self._version_dir(from_version)
        to_dir = self._version_dir(to_version)
        rollback_dir = os.path.join(self.storage_path, f"rollback_from_{from_version}_to_{to_version}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}")

        if not os.path.exists(to_dir):
            print(f"[rollback][STRICT] 目标版本目录不存在 ({to_dir})，回滚失败")
            return False

        # 关键严格校验：尝试加载目标版本 Booster，确保文件可解
        try:
            model_file = os.path.join(to_dir, "model.lgb")
            if not os.path.exists(model_file):
                print(f"[rollback][STRICT] 目标版本 model.lgb 缺失 ({model_file})，回滚失败")
                return False
            probe = lgb.Booster(model_file=model_file)
            if probe.num_model_per_iteration() is None:
                pass  # 只要加载成功就行
            del probe
            print(f"[rollback][STRICT] 目标版本模型加载校验通过")
        except Exception as e:
            print(f"[rollback][STRICT] 目标版本模型文件损坏或不可加载: {e}")
            return False

        try:
            shutil.copytree(to_dir, rollback_dir)
            meta_path = os.path.join(rollback_dir, "metadata.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                meta["is_rollback"] = True
                meta["rollback_from_version"] = from_version
                meta["rollback_timestamp"] = datetime.utcnow().isoformat()
                with open(meta_path, "w", encoding="utf-8") as f:
                    json.dump(meta, f, ensure_ascii=False, indent=2, default=str)
            return True
        except Exception as e:
            print(f"Rollback snapshot error (model is valid though): {e}")
            return True
