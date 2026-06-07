import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from scipy import stats
from typing import List, Dict, Tuple


class AnomalyDetector:
    def __init__(self, z_threshold: float = 3.0, iqr_factor: float = 1.5):
        self.z_threshold = z_threshold
        self.iqr_factor = iqr_factor

    def detect_large_orders(self, df: pd.DataFrame, 
                            item_count_col: str = 'item_count',
                            amount_col: str = 'amount') -> pd.DataFrame:
        if df.empty:
            return df
        
        df = df.copy()
        df['is_large_order'] = False
        
        for col in [item_count_col, amount_col]:
            if col in df.columns:
                valid_data = df[col].dropna()
                if len(valid_data) > 0:
                    q1 = valid_data.quantile(0.25)
                    q3 = valid_data.quantile(0.75)
                    iqr = q3 - q1
                    upper_bound = q3 + self.iqr_factor * iqr
                    
                    z_scores = np.abs(stats.zscore(valid_data, nan_policy='omit'))
                    z_mask = z_scores > self.z_threshold
                    iqr_mask = valid_data > upper_bound
                    
                    anomaly_mask = z_mask | iqr_mask
                    anomaly_indices = valid_data[anomaly_mask].index
                    df.loc[anomaly_indices, 'is_large_order'] = True
                    df.loc[anomaly_indices, 'abnormal_reason'] = df.loc[anomaly_indices, 'abnormal_reason'].fillna('') + \
                        f'|{col}_outlier'
        
        return df

    def detect_extreme_wait_times(self, df: pd.DataFrame,
                                  wait_cols: List[str] = None,
                                  group_by: List[str] = None) -> pd.DataFrame:
        if wait_cols is None:
            wait_cols = ['wait_queue', 'wait_payment', 'wait_serve', 'total_wait']
        
        if group_by is None:
            group_by = ['floor', 'time_slot']
        
        if df.empty:
            return df
        
        df = df.copy()
        df['is_extreme_wait'] = False
        
        for group_keys, group_df in df.groupby(group_by, dropna=False):
            for col in wait_cols:
                if col in group_df.columns and group_df[col].notna().sum() > 10:
                    valid_data = group_df[col].dropna()
                    q1 = valid_data.quantile(0.25)
                    q3 = valid_data.quantile(0.75)
                    iqr = q3 - q1
                    upper_bound = q3 + self.iqr_factor * iqr
                    
                    mask = group_df[col] > upper_bound
                    indices = group_df[mask].index
                    df.loc[indices, 'is_extreme_wait'] = True
                    df.loc[indices, 'abnormal_reason'] = df.loc[indices, 'abnormal_reason'].fillna('') + \
                        f'|{col}_extreme_{group_keys}'
        
        return df

    def mark_outage_orders(self, orders_df: pd.DataFrame,
                           outages_df: pd.DataFrame) -> pd.DataFrame:
        if orders_df.empty or outages_df.empty:
            return orders_df
        
        orders_df = orders_df.copy()
        orders_df['is_outage_affected'] = False
        
        for _, outage in outages_df.iterrows():
            window_id = outage['window_id']
            start_time = outage['start_time']
            end_time = outage['end_time'] if pd.notna(outage['end_time']) else datetime.now()
            
            mask = (
                (orders_df['window_id'] == window_id) &
                (orders_df['queue_start_time'] >= start_time) &
                (orders_df['queue_start_time'] <= end_time)
            )
            
            affected_indices = orders_df[mask].index
            orders_df.loc[affected_indices, 'is_outage_affected'] = True
            orders_df.loc[affected_indices, 'is_abnormal'] = True
            orders_df.loc[affected_indices, 'abnormal_reason'] = \
                orders_df.loc[affected_indices, 'abnormal_reason'].fillna('') + \
                f'|window_outage_{outage["id"]}'
        
        return orders_df

    def get_floor_baseline(self, df: pd.DataFrame,
                           metric_col: str,
                           floor: int,
                           time_slot: str) -> Dict:
        filtered = df[
            (df['floor'] == floor) &
            (df['time_slot'] == time_slot) &
            (~df['is_abnormal'])
        ]
        
        if filtered.empty:
            return {'mean': None, 'median': None, 'p95': None, 'count': 0}
        
        return {
            'mean': filtered[metric_col].mean(),
            'median': filtered[metric_col].median(),
            'p95': filtered[metric_col].quantile(0.95),
            'count': len(filtered)
        }

    def compare_to_floor_baseline(self, df: pd.DataFrame,
                                  metric_col: str,
                                  value: float,
                                  floor: int,
                                  time_slot: str) -> Dict:
        baseline = self.get_floor_baseline(df, metric_col, floor, time_slot)
        
        if baseline['mean'] is None:
            return {'deviation': None, 'ratio': None, 'baseline': baseline}
        
        deviation = value - baseline['mean']
        ratio = value / baseline['mean'] if baseline['mean'] > 0 else None
        
        return {
            'deviation': deviation,
            'ratio': ratio,
            'baseline': baseline
        }

    def clean_data(self, df: pd.DataFrame,
                   outages_df: pd.DataFrame = None,
                   remove_outage: bool = True,
                   remove_large: bool = True,
                   remove_extreme: bool = True) -> pd.DataFrame:
        if df.empty:
            return df
        
        df = self.detect_large_orders(df)
        
        if remove_large:
            df.loc[df['is_large_order'] == True, 'is_abnormal'] = True
        
        df = self.detect_extreme_wait_times(df)
        
        if remove_extreme:
            df.loc[df['is_extreme_wait'] == True, 'is_abnormal'] = True
        
        if outages_df is not None and not outages_df.empty:
            df = self.mark_outage_orders(df, outages_df)
        
        if remove_outage:
            df.loc[df['is_outage_affected'] == True, 'is_abnormal'] = True
        
        return df
