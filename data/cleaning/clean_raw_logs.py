import pandas as pd
import numpy as np
from datetime import datetime
from typing import Optional, List
import json
import re


def parse_timestamp(ts_str: str) -> Optional[datetime]:
    if pd.isna(ts_str) or ts_str is None:
        return None
    try:
        if isinstance(ts_str, (int, float)):
            return datetime.fromtimestamp(ts_str / 1000 if ts_str > 1e12 else ts_str)
        return pd.to_datetime(ts_str)
    except (ValueError, TypeError):
        return None


def parse_tags(tags_raw) -> List[str]:
    if pd.isna(tags_raw):
        return []
    if isinstance(tags_raw, list):
        return [str(t).strip() for t in tags_raw if str(t).strip()]
    if isinstance(tags_raw, str):
        tags_raw = tags_raw.strip()
        if not tags_raw:
            return []
        if tags_raw.startswith("[") and tags_raw.endswith("]"):
            try:
                parsed = json.loads(tags_raw)
                return [str(t).strip() for t in parsed if str(t).strip()]
            except json.JSONDecodeError:
                pass
        return [t.strip() for t in re.split(r"[,，;；|]", tags_raw) if t.strip()]
    return []


def validate_review_log(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    if "enqueue_time" in df.columns:
        df["enqueue_time"] = df["enqueue_time"].apply(parse_timestamp)
    
    for col in ["machine_decision_time", "reviewer_start_time", "reviewer_end_time"]:
        if col in df.columns:
            df[col] = df[col].apply(parse_timestamp)
    
    for col in ["machine_risk_tags", "final_risk_tags"]:
        if col in df.columns:
            df[col] = df[col].apply(parse_tags)
    
    if "reviewer_end_time" in df.columns and "reviewer_start_time" in df.columns:
        valid_duration = df["reviewer_end_time"].notna() & df["reviewer_start_time"].notna()
        df.loc[valid_duration, "review_duration_sec"] = (
            df.loc[valid_duration, "reviewer_end_time"] - df.loc[valid_duration, "reviewer_start_time"]
        ).dt.total_seconds()
        
        invalid_duration = valid_duration & (df["review_duration_sec"] <= 0)
        df.loc[invalid_duration, "reviewer_end_time"] = None
        df.loc[invalid_duration, "review_duration_sec"] = np.nan
    
    if "video_id" not in df.columns:
        df = df.reset_index().rename(columns={"index": "video_id"})
    
    return df


def validate_appeal_log(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    for col in ["appeal_time", "appeal_decision_time"]:
        if col in df.columns:
            df[col] = df[col].apply(parse_timestamp)
    
    if "original_risk_tags" in df.columns:
        df["original_risk_tags"] = df["original_risk_tags"].apply(parse_tags)
    
    if "appeal_result" in df.columns:
        df["appeal_result"] = df["appeal_result"].str.lower().str.strip()
        valid_results = {"success", "failed", "成功", "失败"}
        df.loc[~df["appeal_result"].isin(valid_results), "appeal_result"] = "failed"
        df["appeal_result"] = df["appeal_result"].replace({"成功": "success", "失败": "failed"})
    
    return df


def deduplicate_logs(df: pd.DataFrame, subset: List[str]) -> pd.DataFrame:
    return df.drop_duplicates(subset=subset, keep="last").reset_index(drop=True)
