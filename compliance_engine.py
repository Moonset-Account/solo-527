import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from scipy import stats


@dataclass
class CleaningStats:
    total_samples: int
    removed_missing: int
    removed_outliers: int
    removed_sensor_fault: int
    remaining_samples: int


@dataclass
class ComplianceResult:
    shipment_id: int
    box_id: str
    batch_no: str
    route: str
    from_station: str
    to_station: str
    signoff_time: pd.Timestamp
    sample_count: int
    valid_sample_count: int
    is_valid_for_ranking: bool
    review_status: str
    review_note: str
    total_duration_hours: float
    over_temp_duration_hours: float
    under_temp_duration_hours: float
    compliance_rate: float
    max_temp: float
    min_temp: float
    avg_temp: float
    anomaly_count: int
    removed_count: int
    removed_details: List[Dict]


class TimeSeriesCleaner:
    def __init__(self, min_temp: float = 2.0, max_temp: float = 8.0):
        self.min_temp = min_temp
        self.max_temp = max_temp
    
    def clean_samples(self, df_samples: pd.DataFrame) -> Tuple[pd.DataFrame, CleaningStats]:
        df = df_samples.copy()
        
        df["is_cleaned"] = False
        df["cleaned_reason"] = ""
        
        total_samples = len(df)
        
        missing_mask = df["temperature"].isna()
        df.loc[missing_mask, "is_cleaned"] = True
        df.loc[missing_mask, "cleaned_reason"] = "缺失值"
        removed_missing = missing_mask.sum()
        
        sensor_fault_mask = (df["temperature"] < -50) | (df["temperature"] > 50)
        df.loc[sensor_fault_mask & ~missing_mask, "is_cleaned"] = True
        df.loc[sensor_fault_mask & ~missing_mask, "cleaned_reason"] = "传感器故障"
        removed_sensor_fault = sensor_fault_mask.sum() - missing_mask.sum()
        
        valid_temps = df[~df["is_cleaned"]]["temperature"]
        if len(valid_temps) > 10:
            z_scores = np.abs(stats.zscore(valid_temps))
            outlier_mask = z_scores > 3
            outlier_indices = valid_temps[outlier_mask].index
            df.loc[outlier_indices, "is_cleaned"] = True
            df.loc[outlier_indices, "cleaned_reason"] = "统计异常值"
            removed_outliers = len(outlier_indices)
        else:
            removed_outliers = 0
        
        remaining_samples = total_samples - removed_missing - removed_sensor_fault - removed_outliers
        
        stats = CleaningStats(
            total_samples=total_samples,
            removed_missing=removed_missing,
            removed_outliers=removed_outliers,
            removed_sensor_fault=removed_sensor_fault,
            remaining_samples=remaining_samples
        )
        
        return df, stats


class ComplianceCalculator:
    def __init__(self, min_temp: float = 2.0, max_temp: float = 8.0, min_samples: int = 3):
        self.min_temp = min_temp
        self.max_temp = max_temp
        self.min_samples = min_samples
        self.cleaner = TimeSeriesCleaner(min_temp, max_temp)
    
    def calculate_shipment_compliance(
        self, 
        shipment_row: pd.Series, 
        df_samples: pd.DataFrame
    ) -> ComplianceResult:
        shipment_id = shipment_row["shipment_id"]
        ship_samples = df_samples[df_samples["shipment_id"] == shipment_id].copy()
        
        cleaned_samples, cleaning_stats = self.cleaner.clean_samples(ship_samples)
        valid_samples = cleaned_samples[~cleaned_samples["is_cleaned"]].copy()
        
        valid_sample_count = len(valid_samples)
        is_valid_for_ranking = valid_sample_count >= self.min_samples
        
        removed_details = []
        for _, row in cleaned_samples[cleaned_samples["is_cleaned"]].iterrows():
            removed_details.append({
                "timestamp": row["timestamp"],
                "temperature": row["temperature"],
                "reason": row["cleaned_reason"]
            })
        
        if len(valid_samples) < 2:
            return ComplianceResult(
                shipment_id=shipment_id,
                box_id=shipment_row["box_id"],
                batch_no=shipment_row["batch_no"],
                route=shipment_row["route"],
                from_station=shipment_row["from_station"],
                to_station=shipment_row["to_station"],
                signoff_time=shipment_row["signoff_time"],
                sample_count=len(ship_samples),
                valid_sample_count=valid_sample_count,
                is_valid_for_ranking=is_valid_for_ranking,
                review_status=shipment_row["review_status"],
                review_note=shipment_row["review_note"],
                total_duration_hours=0,
                over_temp_duration_hours=0,
                under_temp_duration_hours=0,
                compliance_rate=0,
                max_temp=None,
                min_temp=None,
                avg_temp=None,
                anomaly_count=0,
                removed_count=cleaning_stats.removed_missing + cleaning_stats.removed_outliers + cleaning_stats.removed_sensor_fault,
                removed_details=removed_details
            )
        
        valid_samples = valid_samples.sort_values("timestamp")
        time_diff = valid_samples["timestamp"].diff().dt.total_seconds() / 3600
        time_diff = time_diff.fillna(0)
        
        total_duration_hours = (
            valid_samples["timestamp"].max() - valid_samples["timestamp"].min()
        ).total_seconds() / 3600
        
        over_temp_mask = valid_samples["temperature"] > self.max_temp
        under_temp_mask = valid_samples["temperature"] < self.min_temp
        
        over_temp_duration_hours = time_diff[over_temp_mask].sum()
        under_temp_duration_hours = time_diff[under_temp_mask].sum()
        
        valid_duration = total_duration_hours if total_duration_hours > 0 else 1
        compliance_duration = valid_duration - over_temp_duration_hours - under_temp_duration_hours
        compliance_rate = max(0, min(100, (compliance_duration / valid_duration) * 100))
        
        anomaly_count = int(over_temp_mask.sum() + under_temp_mask.sum())
        
        return ComplianceResult(
            shipment_id=shipment_id,
            box_id=shipment_row["box_id"],
            batch_no=shipment_row["batch_no"],
            route=shipment_row["route"],
            from_station=shipment_row["from_station"],
            to_station=shipment_row["to_station"],
            signoff_time=shipment_row["signoff_time"],
            sample_count=len(ship_samples),
            valid_sample_count=valid_sample_count,
            is_valid_for_ranking=is_valid_for_ranking,
            review_status=shipment_row["review_status"],
            review_note=shipment_row["review_note"],
            total_duration_hours=round(total_duration_hours, 2),
            over_temp_duration_hours=round(over_temp_duration_hours, 2),
            under_temp_duration_hours=round(under_temp_duration_hours, 2),
            compliance_rate=round(compliance_rate, 2),
            max_temp=round(valid_samples["temperature"].max(), 2),
            min_temp=round(valid_samples["temperature"].min(), 2),
            avg_temp=round(valid_samples["temperature"].mean(), 2),
            anomaly_count=anomaly_count,
            removed_count=cleaning_stats.removed_missing + cleaning_stats.removed_outliers + cleaning_stats.removed_sensor_fault,
            removed_details=removed_details
        )
    
    def calculate_all_compliance(
        self, 
        df_shipments: pd.DataFrame, 
        df_samples: pd.DataFrame
    ) -> List[ComplianceResult]:
        results = []
        for _, row in df_shipments.iterrows():
            result = self.calculate_shipment_compliance(row, df_samples)
            results.append(result)
        return results
    
    def results_to_dataframe(self, results: List[ComplianceResult]) -> pd.DataFrame:
        data = []
        for r in results:
            data.append({
                "shipment_id": r.shipment_id,
                "box_id": r.box_id,
                "batch_no": r.batch_no,
                "route": r.route,
                "from_station": r.from_station,
                "to_station": r.to_station,
                "signoff_time": r.signoff_time,
                "sample_count": r.sample_count,
                "valid_sample_count": r.valid_sample_count,
                "is_valid_for_ranking": r.is_valid_for_ranking,
                "review_status": r.review_status,
                "review_note": r.review_note,
                "total_duration_hours": r.total_duration_hours,
                "over_temp_duration_hours": r.over_temp_duration_hours,
                "under_temp_duration_hours": r.under_temp_duration_hours,
                "compliance_rate": r.compliance_rate,
                "max_temp": r.max_temp,
                "min_temp": r.min_temp,
                "avg_temp": r.avg_temp,
                "anomaly_count": r.anomaly_count,
                "removed_count": r.removed_count
            })
        return pd.DataFrame(data)
    
    def get_ranking_data(self, df_results: pd.DataFrame, exclude_review: bool = True) -> pd.DataFrame:
        mask = df_results["is_valid_for_ranking"] == True
        if exclude_review:
            mask = mask & (df_results["review_status"].isin(["none", "resolved"]))
        
        return df_results[mask].copy()
    
    def get_pending_review_data(self, df_results: pd.DataFrame) -> pd.DataFrame:
        return df_results[
            (~df_results["is_valid_for_ranking"]) | 
            (df_results["review_status"].isin(["pending", "appealed"]))
        ].copy()
