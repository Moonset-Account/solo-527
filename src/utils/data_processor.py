import pandas as pd
import numpy as np
from datetime import datetime
from src.database.mock_data import STAGES, STAGE_NAMES


def clean_timestamps(df):
    """
    清洗时间戳数据，确保时间顺序合理
    补录时间不会覆盖真实发生时间，source字段标记数据来源
    """
    df = df.copy()
    
    time_columns = ['collected_at', 'dispatched_at', 'received_at', 'tested_at', 'reviewed_at', 'reported_at']
    
    for col in time_columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    stage_pairs = [
        ('collected_at', 'dispatched_at'),
        ('dispatched_at', 'received_at'),
        ('received_at', 'tested_at'),
        ('tested_at', 'reviewed_at'),
        ('reviewed_at', 'reported_at')
    ]
    
    for start_col, end_col in stage_pairs:
        if start_col in df.columns and end_col in df.columns:
            mask = (df[end_col].notna()) & (df[start_col].notna()) & (df[end_col] < df[start_col])
            df.loc[mask, end_col] = np.nan
    
    return df


def calculate_stage_durations(df):
    """
    计算各环节耗时（分钟）
    """
    df = df.copy()
    
    stage_mappings = [
        ('collection_to_dispatch', 'collected_at', 'dispatched_at'),
        ('dispatch_to_receive', 'dispatched_at', 'received_at'),
        ('receive_to_test', 'received_at', 'tested_at'),
        ('test_to_review', 'tested_at', 'reviewed_at'),
        ('review_to_report', 'reviewed_at', 'reported_at')
    ]
    
    for stage_name, start_col, end_col in stage_mappings:
        if start_col in df.columns and end_col in df.columns:
            df[f'{stage_name}_minutes'] = (df[end_col] - df[start_col]).dt.total_seconds() / 60
            df[f'{stage_name}_minutes'] = df[f'{stage_name}_minutes'].round(2)
    
    if 'collected_at' in df.columns and 'reported_at' in df.columns:
        df['total_duration_minutes'] = (df['reported_at'] - df['collected_at']).dt.total_seconds() / 60
        df['total_duration_minutes'] = df['total_duration_minutes'].round(2)
    
    return df


def check_timeouts(df, thresholds_df):
    """
    检查各环节是否超时
    """
    df = df.copy()
    
    for _, threshold in thresholds_df.iterrows():
        sample_type = threshold['sample_type']
        priority = threshold['priority']
        stage_name = threshold['stage_name']
        threshold_val = threshold['threshold_minutes']
        
        duration_col = f'{stage_name}_minutes'
        timeout_col = f'{stage_name}_timeout'
        
        if duration_col in df.columns:
            mask = (
                (df['sample_type'] == sample_type) & 
                (df['priority'] == priority) &
                (df[duration_col].notna())
            )
            df.loc[mask, timeout_col] = df.loc[mask, duration_col] > threshold_val
            df.loc[mask, f'{stage_name}_threshold'] = threshold_val
    
    df['any_timeout'] = df[[f'{s}_timeout' for s in STAGES if f'{s}_timeout' in df.columns]].any(axis=1)
    
    df['timeout_stages'] = df.apply(
        lambda row: [STAGE_NAMES[s] for s in STAGES 
                    if f'{s}_timeout' in row and pd.notna(row[f'{s}_timeout']) and row[f'{s}_timeout']],
        axis=1
    )
    
    return df


def analyze_timeout_reasons(df, returns_df):
    """
    分析超时原因，关联退回记录
    """
    df = df.copy()
    
    if not returns_df.empty:
        return_summary = returns_df.groupby('sample_id').agg({
            'return_reason': lambda x: '; '.join(x.dropna().astype(str)),
            'responsible_department': lambda x: '; '.join(x.dropna().astype(str)),
            'return_time': 'count'
        }).rename(columns={'return_time': 'return_count'})
        
        df = df.merge(return_summary, on='sample_id', how='left')
        df['has_return'] = df['return_count'].notna() & (df['return_count'] > 0)
    else:
        df['has_return'] = False
        df['return_reason'] = None
        df['responsible_department_return'] = None
        df['return_count'] = 0
    
    return df


def filter_by_criteria(df, start_date=None, end_date=None, sample_types=None, 
                       priorities=None, departments=None, only_timeout=False, only_returned=False):
    """
    按筛选条件过滤数据
    """
    df = df.copy()
    
    if start_date is not None:
        df = df[df['collected_at'] >= pd.to_datetime(start_date)]
    if end_date is not None:
        df = df[df['collected_at'] <= pd.to_datetime(end_date)]
    
    if sample_types and len(sample_types) > 0:
        df = df[df['sample_type'].isin(sample_types)]
    if priorities and len(priorities) > 0:
        df = df[df['priority'].isin(priorities)]
    if departments and len(departments) > 0:
        df = df[df['requesting_department'].isin(departments)]
    
    if only_timeout:
        df = df[df['any_timeout'] == True]
    if only_returned:
        df = df[df['has_return'] == True]
    
    return df


def get_stage_duration_stats(df, group_by=None):
    """
    统计各环节耗时指标
    """
    stats = {}
    
    for stage in STAGES:
        col = f'{stage}_minutes'
        if col in df.columns and df[col].notna().any():
            data = df[col].dropna()
            stats[stage] = {
                'count': len(data),
                'mean': round(data.mean(), 2),
                'median': round(data.median(), 2),
                'p25': round(data.quantile(0.25), 2),
                'p75': round(data.quantile(0.75), 2),
                'p95': round(data.quantile(0.95), 2),
                'min': round(data.min(), 2),
                'max': round(data.max(), 2),
                'std': round(data.std(), 2)
            }
    
    if group_by is not None and group_by in df.columns:
        grouped_stats = {}
        for group_val, group_df in df.groupby(group_by):
            grouped_stats[group_val] = get_stage_duration_stats(group_df)
        return grouped_stats
    
    return stats


def get_timeout_summary(df, thresholds_df):
    """
    超时统计汇总
    """
    summary = {}
    
    for stage in STAGES:
        timeout_col = f'{stage}_timeout'
        if timeout_col in df.columns:
            total = df[timeout_col].notna().sum()
            timed_out = df[timeout_col].sum() if total > 0 else 0
            timeout_rate = round(timed_out / total * 100, 2) if total > 0 else 0
            summary[stage] = {
                'total': int(total),
                'timed_out': int(timed_out),
                'timeout_rate': timeout_rate
            }
    
    return summary


def get_department_comparison(df):
    """
    科室对比统计
    """
    dept_stats = []
    
    for dept, dept_df in df.groupby('requesting_department'):
        total = len(dept_df)
        if total < 5:
            continue
            
        total_duration_col = 'total_duration_minutes'
        avg_duration = dept_df[total_duration_col].mean() if total_duration_col in dept_df.columns else None
        
        timeout_count = dept_df['any_timeout'].sum() if 'any_timeout' in dept_df.columns else 0
        timeout_rate = round(timeout_count / total * 100, 2) if total > 0 else 0
        
        return_count = dept_df['has_return'].sum() if 'has_return' in dept_df.columns else 0
        return_rate = round(return_count / total * 100, 2) if total > 0 else 0
        
        dept_stats.append({
            'department': dept,
            'sample_count': total,
            'avg_total_duration_minutes': round(avg_duration, 2) if avg_duration else None,
            'timeout_count': int(timeout_count),
            'timeout_rate': timeout_rate,
            'return_count': int(return_count),
            'return_rate': return_rate
        })
    
    return pd.DataFrame(dept_stats).sort_values('sample_count', ascending=False)


def process_full_pipeline(samples_df, thresholds_df, returns_df=None):
    """
    完整数据处理流水线
    """
    if returns_df is None:
        returns_df = pd.DataFrame()
    
    df = clean_timestamps(samples_df)
    df = calculate_stage_durations(df)
    df = check_timeouts(df, thresholds_df)
    df = analyze_timeout_reasons(df, returns_df)
    
    return df
