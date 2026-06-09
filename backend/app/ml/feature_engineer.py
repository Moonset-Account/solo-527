import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


class FeatureEngineer:
    FEATURE_COLUMNS = [
        "patient_age",
        "patient_gender_encoded",
        "department_no_show_rate",
        "appointment_day_of_week",
        "appointment_hour",
        "appointment_type_encoded",
        "is_revisit",
        "channel_encoded",
        "reminder_method_encoded",
        "days_in_advance",
        "patient_historical_no_show_rate",
        "time_slot_no_show_rate",
        "distance_km",
        "weather_condition_encoded",
        "is_holiday",
        "is_weekend",
        "appointment_month",
        "doctor_popularity_score",
    ]

    PROTECTED_COLUMNS = ["patient_race", "patient_ethnicity", "patient_nationality", 
                         "patient_religion", "patient_marital_status", "patient_income_level"]

    RISK_LEVELS = ["low", "medium", "high", "critical"]

    @classmethod
    def _check_protected_fields(cls, df: pd.DataFrame) -> List[str]:
        found = [col for col in cls.PROTECTED_COLUMNS if col in df.columns]
        return found

    @classmethod
    def clean_dataframe(cls, df: pd.DataFrame) -> pd.DataFrame:
        protected = cls._check_protected_fields(df)
        if protected:
            df = df.drop(columns=protected, errors="ignore")
        return df

    @classmethod
    def _encode_gender(cls, gender: Optional[str]) -> int:
        if pd.isna(gender) or gender is None:
            return 0
        g = str(gender).lower()
        if g in ["男", "male", "m"]:
            return 1
        elif g in ["女", "female", "f"]:
            return 2
        return 0

    @classmethod
    def _encode_appointment_type(cls, atype: Optional[str]) -> int:
        if pd.isna(atype) or atype is None:
            return 0
        a = str(atype)
        mapping = {
            "普通门诊": 1, "专家门诊": 2, "特需门诊": 3,
            "急诊": 4, "复诊": 5, "体检": 6
        }
        return mapping.get(a, 0)

    @classmethod
    def _encode_channel(cls, channel: Optional[str]) -> int:
        if pd.isna(channel) or channel is None:
            return 0
        c = str(channel)
        mapping = {
            "现场挂号": 1, "电话预约": 2, "APP预约": 3,
            "微信预约": 4, "官网预约": 5, "第三方平台": 6
        }
        return mapping.get(c, 0)

    @classmethod
    def _encode_reminder(cls, method: Optional[str]) -> int:
        if pd.isna(method) or method is None:
            return 0
        m = str(method).lower()
        mapping = {"none": 0, "sms": 1, "call": 2, "wechat": 3, "app_push": 4, "email": 5}
        return mapping.get(m, 0)

    @classmethod
    def _encode_weather(cls, weather: Optional[str]) -> int:
        if pd.isna(weather) or weather is None:
            return 0
        w = str(weather)
        mapping = {
            "晴": 1, "多云": 2, "阴": 3, "小雨": 4,
            "中雨": 5, "大雨": 6, "雪": 7, "雾": 8, "霾": 9
        }
        return mapping.get(w, 0)

    @classmethod
    def build_features(
        cls,
        appointments_df: pd.DataFrame,
        departments_df: Optional[pd.DataFrame] = None,
        time_slots_df: Optional[pd.DataFrame] = None,
        is_training: bool = False,
    ) -> pd.DataFrame:
        appointments_df = cls.clean_dataframe(appointments_df.copy())

        df = pd.DataFrame()
        df["appointment_id"] = appointments_df.get("id", appointments_df.index)

        df["patient_age"] = appointments_df.get("patient_age", 35).fillna(35).astype(int)
        df["patient_age"] = df["patient_age"].clip(0, 100)

        df["patient_gender_encoded"] = appointments_df.get("patient_gender").apply(cls._encode_gender)

        dept_rates = {}
        if departments_df is not None and len(departments_df) > 0:
            for _, row in departments_df.iterrows():
                dept_rates[int(row["id"])] = float(row.get("default_no_show_rate", 15))
        df["department_no_show_rate"] = appointments_df.get("department_id", 1).apply(
            lambda x: dept_rates.get(int(x) if pd.notna(x) else 1, 15.0)
        )

        if "appointment_date" in appointments_df.columns:
            dates = pd.to_datetime(appointments_df["appointment_date"])
            df["appointment_day_of_week"] = dates.dt.dayofweek
            df["appointment_month"] = dates.dt.month
            df["is_weekend"] = (dates.dt.dayofweek >= 5).astype(int)
        else:
            df["appointment_day_of_week"] = 1
            df["appointment_month"] = 1
            df["is_weekend"] = 0

        if "appointment_time" in appointments_df.columns:
            times = pd.to_datetime(appointments_df["appointment_time"].astype(str), format="mixed", errors="coerce")
            df["appointment_hour"] = times.dt.hour.fillna(9).astype(int)
        else:
            df["appointment_hour"] = 9

        df["appointment_type_encoded"] = appointments_df.get("appointment_type").apply(cls._encode_appointment_type)
        df["is_revisit"] = appointments_df.get("is_revisit", False).astype(int)
        df["channel_encoded"] = appointments_df.get("channel").apply(cls._encode_channel)
        df["reminder_method_encoded"] = appointments_df.get("reminder_method").apply(cls._encode_reminder)

        df["days_in_advance"] = appointments_df.get("days_in_advance", 1).fillna(1).astype(int).clip(0, 60)

        hist_no = appointments_df.get("historical_no_show_count", 0).fillna(0).astype(int)
        hist_total = appointments_df.get("historical_total_count", 0).fillna(0).astype(int)
        df["patient_historical_no_show_rate"] = np.where(
            hist_total > 0,
            (hist_no / hist_total * 100).round(2),
            0.0
        )

        slot_rates = {}
        if time_slots_df is not None and len(time_slots_df) > 0:
            for _, row in time_slots_df.iterrows():
                key = (int(row["department_id"]), int(row["day_of_week"]))
                total = int(row.get("historical_total_count", 0))
                no_show = int(row.get("historical_no_show_count", 0))
                slot_rates[key] = (no_show / total * 100) if total > 0 else 15.0
        def _get_slot_rate(row):
            key = (
                int(row.get("department_id", 1)) if pd.notna(row.get("department_id")) else 1,
                int(row.get("appointment_day_of_week", 1))
            )
            return slot_rates.get(key, 15.0)
        df["time_slot_no_show_rate"] = df.apply(_get_slot_rate, axis=1)

        df["distance_km"] = appointments_df.get("distance_km", 5.0).fillna(5.0).astype(float).clip(0, 100)
        df["weather_condition_encoded"] = appointments_df.get("weather_condition").apply(cls._encode_weather)
        df["is_holiday"] = appointments_df.get("is_holiday", False).astype(int)

        if "doctor_name" in appointments_df.columns:
            doctor_counts = appointments_df["doctor_name"].value_counts(normalize=True)
            df["doctor_popularity_score"] = appointments_df["doctor_name"].apply(
                lambda x: float(doctor_counts.get(x, 0.01) * 1000) if pd.notna(x) else 1.0
            )
        else:
            df["doctor_popularity_score"] = 1.0

        for col in cls.FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0

        df = df[["appointment_id"] + cls.FEATURE_COLUMNS]
        df = df.fillna(0)

        return df

    @classmethod
    def extract_labels(cls, appointments_df: pd.DataFrame, actual_status_col: str = "actual_status") -> pd.Series:
        def _is_no_show(status):
            if pd.isna(status):
                return np.nan
            s = str(status).lower()
            return 1 if s in ["noshow", "no_show", "爽约", "missed", "absent"] else 0
        labels = appointments_df[actual_status_col].apply(_is_no_show)
        return labels

    @classmethod
    def get_risk_level(cls, score: float, thresholds: Optional[Dict[str, float]] = None) -> str:
        t = thresholds or {"low": 0.2, "medium": 0.5, "high": 0.8}
        if score >= t["high"]:
            return "critical"
        elif score >= t["medium"]:
            return "high"
        elif score >= t["low"]:
            return "medium"
        else:
            return "low"
