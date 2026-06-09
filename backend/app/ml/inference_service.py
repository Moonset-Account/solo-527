import lightgbm as lgb
import pandas as pd
import numpy as np
import joblib
import os
import time
from typing import Dict, Any, List, Optional, Tuple
from app.ml.feature_engineer import FeatureEngineer
from app.ml.lgb_trainer import LightGBMTrainer
from app.core.config import settings


class InferenceService:
    def __init__(self):
        self.active_version: Optional[str] = None
        self.trainer = LightGBMTrainer()
        self._model_cache: Dict[str, lgb.Booster] = {}
        self._explainer_cache: Dict[str, Any] = {}
        self._feature_cache: Dict[str, List[str]] = {}

    def set_active_version(self, version: str) -> bool:
        if version in self._model_cache:
            self.active_version = version
            return True
        if self.trainer.load_model(version):
            self._model_cache[version] = self.trainer.model
            self._explainer_cache[version] = self.trainer.explainer
            self._feature_cache[version] = self.trainer.feature_names
            self.active_version = version
            return True
        return False

    def get_active_version(self) -> Optional[str]:
        return self.active_version

    def _get_model(self, version: Optional[str] = None) -> Optional[lgb.Booster]:
        v = version or self.active_version
        if not v:
            return None
        if v not in self._model_cache:
            if not self.trainer.load_model(v):
                return None
            self._model_cache[v] = self.trainer.model
            self._explainer_cache[v] = self.trainer.explainer
            self._feature_cache[v] = self.trainer.feature_names
        return self._model_cache[v]

    def _get_explainer(self, version: Optional[str] = None):
        v = version or self.active_version
        return self._explainer_cache.get(v)

    def _get_features(self, version: Optional[str] = None) -> List[str]:
        v = version or self.active_version
        if v not in self._feature_cache:
            self._get_model(v)
        return self._feature_cache.get(v, FeatureEngineer.FEATURE_COLUMNS)

    def predict_single(
        self,
        features: Dict[str, Any],
        version: Optional[str] = None,
        explain: bool = True,
    ) -> Optional[Dict[str, Any]]:
        model = self._get_model(version)
        if model is None:
            return None

        feature_names = self._get_features(version)
        values = []
        for fn in feature_names:
            val = features.get(fn, 0)
            if val is None or (isinstance(val, float) and np.isnan(val)):
                val = 0
            values.append(val)

        X = pd.DataFrame([values], columns=feature_names)

        start = time.time()
        proba = float(model.predict(X, num_iteration=model.best_iteration)[0])
        scoring_time_ms = int((time.time() - start) * 1000)

        risk_level = FeatureEngineer.get_risk_level(proba)

        result = {
            "risk_score": round(proba, 4),
            "risk_level": risk_level,
            "risk_threshold": 0.5,
            "scoring_time_ms": scoring_time_ms,
            "top_features": [],
            "shap_values": None,
            "recommendation": self._generate_recommendation(risk_level, proba),
        }

        if explain:
            top_features, shap_data = self._explain_single(X, version)
            result["top_features"] = top_features
            result["shap_values"] = shap_data

        return result

    def predict_batch(
        self,
        features_df: pd.DataFrame,
        version: Optional[str] = None,
        explain: bool = False,
    ) -> List[Dict[str, Any]]:
        model = self._get_model(version)
        if model is None:
            return []

        feature_names = self._get_features(version)

        if "appointment_id" in features_df.columns:
            ids = features_df["appointment_id"].tolist()
            X = features_df.drop(columns=["appointment_id"])
        else:
            ids = list(range(len(features_df)))
            X = features_df.copy()

        for col in feature_names:
            if col not in X.columns:
                X[col] = 0
        X = X[feature_names].fillna(0)

        start = time.time()
        probas = model.predict(X, num_iteration=model.best_iteration)
        total_time_ms = int((time.time() - start) * 1000)
        per_sample_ms = max(1, total_time_ms // max(1, len(X)))

        results = []
        for i in range(len(X)):
            proba = float(probas[i])
            risk_level = FeatureEngineer.get_risk_level(proba)
            result = {
                "appointment_id": ids[i],
                "risk_score": round(proba, 4),
                "risk_level": risk_level,
                "risk_threshold": 0.5,
                "scoring_time_ms": per_sample_ms,
                "top_features": [],
                "recommendation": self._generate_recommendation(risk_level, proba),
            }
            if explain and i < 20:
                sample_df = X.iloc[[i]]
                top_f, _ = self._explain_single(sample_df, version)
                result["top_features"] = top_f
            results.append(result)

        return results

    def _explain_single(
        self, X: pd.DataFrame, version: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], Optional[List[Dict[str, Any]]]]:
        explainer = self._get_explainer(version)
        feature_names = self._get_features(version)
        top_features = []
        shap_values_list = None

        if explainer is not None:
            try:
                shap_values = explainer.shap_values(X)
                if isinstance(shap_values, list):
                    sv = np.array(shap_values[1])
                else:
                    sv = np.array(shap_values)
                sv_row = sv[0]

                abs_sv = np.abs(sv_row)
                top_idx = np.argsort(abs_sv)[::-1][:5]

                feature_display_names = self._feature_display_names()

                top_features = []
                for idx in top_idx:
                    fname = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
                    display_name = feature_display_names.get(fname, fname)
                    raw_val = float(X.iloc[0, idx])
                    contribution = float(sv_row[idx])
                    top_features.append({
                        "feature": fname,
                        "display_name": display_name,
                        "value": round(raw_val, 2),
                        "contribution": round(contribution, 4),
                        "impact": "increase_risk" if contribution > 0 else "decrease_risk",
                    })

                shap_values_list = []
                for idx in range(len(feature_names)):
                    fname = feature_names[idx]
                    shap_values_list.append({
                        "feature": fname,
                        "display_name": feature_display_names.get(fname, fname),
                        "value": float(X.iloc[0, idx]),
                        "shap_value": round(float(sv_row[idx]), 4),
                    })
            except Exception as e:
                print(f"SHAP explanation error: {e}")
                top_features = self._fallback_feature_importance(X, feature_names)
        else:
            top_features = self._fallback_feature_importance(X, feature_names)

        return top_features, shap_values_list

    def _fallback_feature_importance(
        self, X: pd.DataFrame, feature_names: List[str]
    ) -> List[Dict[str, Any]]:
        feature_display_names = self._feature_display_names()
        model = self._get_model()
        fi = []
        if model is not None:
            try:
                gain = model.feature_importance(importance_type="gain")
                total = gain.sum() or 1
                for i, name in enumerate(feature_names):
                    raw_val = float(X.iloc[0, i])
                    ratio = float(gain[i] / total)
                    fi.append({
                        "feature": name,
                        "display_name": feature_display_names.get(name, name),
                        "value": round(raw_val, 2),
                        "contribution": round(ratio * 0.5, 4),
                        "impact": "unknown",
                    })
                fi.sort(key=lambda x: x["contribution"], reverse=True)
                return fi[:5]
            except Exception:
                pass

        for i, name in enumerate(feature_names[:5]):
            raw_val = float(X.iloc[0, i])
            fi.append({
                "feature": name,
                "display_name": feature_display_names.get(name, name),
                "value": round(raw_val, 2),
                "contribution": 0.0,
                "impact": "unknown",
            })
        return fi

    def _feature_display_names(self) -> Dict[str, str]:
        return {
            "patient_age": "患者年龄",
            "patient_gender_encoded": "患者性别",
            "department_no_show_rate": "科室历史爽约率",
            "appointment_day_of_week": "预约星期",
            "appointment_hour": "预约小时",
            "appointment_type_encoded": "门诊类型",
            "is_revisit": "是否复诊",
            "channel_encoded": "挂号渠道",
            "reminder_method_encoded": "提醒方式",
            "days_in_advance": "提前预约天数",
            "patient_historical_no_show_rate": "患者历史爽约率",
            "time_slot_no_show_rate": "时段历史爽约率",
            "distance_km": "到院距离(公里)",
            "weather_condition_encoded": "天气情况",
            "is_holiday": "是否节假日",
            "is_weekend": "是否周末",
            "appointment_month": "预约月份",
            "doctor_popularity_score": "医生热度指数",
        }

    def _generate_recommendation(self, risk_level: str, score: float) -> str:
        if risk_level == "critical":
            return f"极高风险({score:.1%})，建议立即人工电话回访确认，并发送强化提醒短信"
        elif risk_level == "high":
            return f"高风险({score:.1%})，建议发送定制化提醒短信，并列入人工回访名单"
        elif risk_level == "medium":
            return f"中风险({score:.1%})，建议发送常规提醒短信，可选择性回访"
        else:
            return f"低风险({score:.1%})，常规处理，发送标准提醒即可"

    def clear_cache(self) -> None:
        self._model_cache.clear()
        self._explainer_cache.clear()
        self._feature_cache.clear()


inference_service = InferenceService()
