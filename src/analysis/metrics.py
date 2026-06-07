import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from .time_slicer import TimeSlicer
from .anomaly_detector import AnomalyDetector


class QueueMetrics:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.df['queue_start_time'] = pd.to_datetime(self.df['queue_start_time'])
        self.time_slicer = TimeSlicer()
        self.anomaly_detector = AnomalyDetector()

    def analyze_queue_start_patterns(self, group_by: List[str] = None) -> pd.DataFrame:
        if group_by is None:
            group_by = ['window_id', 'floor', 'time_slot']
        
        valid = self.df[~self.df['is_abnormal']].copy()
        
        if valid.empty:
            return pd.DataFrame()
        
        valid['queue_hour'] = valid['queue_start_time'].dt.hour
        valid['queue_minute'] = valid['queue_start_time'].dt.minute
        valid['queue_time_minutes'] = valid['queue_hour'] * 60 + valid['queue_minute']
        
        patterns = valid.groupby(group_by).agg(
            avg_queue_start=('queue_time_minutes', 'mean'),
            median_queue_start=('queue_time_minutes', 'median'),
            p25_queue_start=('queue_time_minutes', lambda x: x.quantile(0.25)),
            p75_queue_start=('queue_time_minutes', lambda x: x.quantile(0.75)),
            earliest_queue=('queue_time_minutes', 'min'),
            latest_queue=('queue_time_minutes', 'max'),
            queue_count=('order_no', 'count')
        ).reset_index()
        
        def minutes_to_time(m):
            if pd.isna(m):
                return None
            h = int(m // 60)
            mi = int(m % 60)
            return f"{h:02d}:{mi:02d}"
        
        for col in ['avg_queue_start', 'median_queue_start', 'p25_queue_start', 
                    'p75_queue_start', 'earliest_queue', 'latest_queue']:
            patterns[col + '_time'] = patterns[col].apply(minutes_to_time)
        
        return patterns

    def get_queue_distribution_by_time(self, window_id: int = None,
                                       bucket_minutes: int = 10) -> pd.DataFrame:
        valid = self.df[~self.df['is_abnormal']].copy()
        
        if window_id is not None:
            valid = valid[valid['window_id'] == window_id]
        
        if valid.empty:
            return pd.DataFrame()
        
        valid['time_bucket'] = valid['queue_start_time'].apply(
            lambda x: self.time_slicer.get_time_bucket(x, bucket_minutes)
        )
        
        distribution = valid.groupby(['time_bucket', 'time_slot']).agg(
            queue_count=('order_no', 'count'),
            avg_wait_queue=('wait_queue', 'mean'),
            avg_total_wait=('total_wait', 'mean')
        ).reset_index()
        
        return distribution

    def compare_floor_baseline(self, window_id: int, metric: str = 'wait_queue') -> Dict:
        window_data = self.df[self.df['window_id'] == window_id]
        
        if window_data.empty:
            return {}
        
        floor = window_data['floor'].iloc[0]
        time_slot = window_data['time_slot'].iloc[0]
        
        window_avg = window_data[~window_data['is_abnormal']][metric].mean()
        
        comparison = self.anomaly_detector.compare_to_floor_baseline(
            self.df, metric, window_avg, floor, time_slot
        )
        
        return {
            'window_id': window_id,
            'floor': floor,
            'time_slot': time_slot,
            'window_avg': window_avg,
            **comparison
        }

    def detect_queue_spikes(self, threshold_multiplier: float = 2.0) -> pd.DataFrame:
        valid = self.df[~self.df['is_abnormal']].copy()
        
        if valid.empty:
            return pd.DataFrame()
        
        valid['date'] = valid['queue_start_time'].dt.date
        valid['time_bucket'] = valid['queue_start_time'].apply(
            lambda x: self.time_slicer.get_time_bucket(x, 5)
        )
        
        hourly = valid.groupby(['window_id', 'date', 'time_bucket']).agg(
            count=('order_no', 'count')
        ).reset_index()
        
        baseline = hourly.groupby(['window_id']).agg(
            baseline_avg=('count', 'mean'),
            baseline_std=('count', 'std')
        ).reset_index()
        
        hourly = hourly.merge(baseline, on='window_id')
        hourly['is_spike'] = hourly['count'] > hourly['baseline_avg'] + threshold_multiplier * hourly['baseline_std']
        
        return hourly[hourly['is_spike']]


class ServeMetrics:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.df['serve_time'] = pd.to_datetime(self.df['serve_time'])
        self.df['queue_start_time'] = pd.to_datetime(self.df['queue_start_time'])
        self.time_slicer = TimeSlicer()
        self.anomaly_detector = AnomalyDetector()

    def analyze_serve_patterns(self, group_by: List[str] = None) -> pd.DataFrame:
        if group_by is None:
            group_by = ['window_id', 'floor', 'time_slot']
        
        valid = self.df[~self.df['is_abnormal']].copy()
        
        if valid.empty:
            return pd.DataFrame()
        
        valid['serve_hour'] = valid['serve_time'].dt.hour
        valid['serve_minute'] = valid['serve_time'].dt.minute
        valid['serve_time_minutes'] = valid['serve_hour'] * 60 + valid['serve_minute']
        
        patterns = valid.groupby(group_by).agg(
            avg_serve_time=('serve_time_minutes', 'mean'),
            median_serve_time=('serve_time_minutes', 'median'),
            p95_serve_time=('serve_time_minutes', lambda x: x.quantile(0.95)),
            avg_serve_duration=('wait_serve', 'mean'),
            p95_serve_duration=('wait_serve', lambda x: x.quantile(0.95)),
            serve_count=('order_no', 'count'),
            avg_payment_wait=('wait_payment', 'mean')
        ).reset_index()
        
        def minutes_to_time(m):
            if pd.isna(m):
                return None
            h = int(m // 60)
            mi = int(m % 60)
            return f"{h:02d}:{mi:02d}"
        
        patterns['avg_serve_time_str'] = patterns['avg_serve_time'].apply(minutes_to_time)
        patterns['median_serve_time_str'] = patterns['median_serve_time'].apply(minutes_to_time)
        
        return patterns

    def get_serve_distribution(self, window_id: int = None,
                               bucket_minutes: int = 5) -> pd.DataFrame:
        valid = self.df[~self.df['is_abnormal']].copy()
        
        if window_id is not None:
            valid = valid[valid['window_id'] == window_id]
        
        if valid.empty:
            return pd.DataFrame()
        
        valid['serve_bucket'] = valid['serve_time'].apply(
            lambda x: self.time_slicer.get_time_bucket(x, bucket_minutes)
        )
        
        dist = valid.groupby(['serve_bucket', 'dish_id']).agg(
            serve_count=('order_no', 'count'),
            avg_serve_duration=('wait_serve', 'mean'),
            avg_total_wait=('total_wait', 'mean')
        ).reset_index()
        
        return dist

    def get_payment_wait_analysis(self) -> pd.DataFrame:
        valid = self.df[~self.df['is_abnormal']].copy()
        
        if valid.empty:
            return pd.DataFrame()
        
        analysis = valid.groupby(['window_id', 'floor', 'time_slot', 'is_big_break']).agg(
            avg_payment_wait=('wait_payment', 'mean'),
            median_payment_wait=('wait_payment', 'median'),
            p95_payment_wait=('wait_payment', lambda x: x.quantile(0.95)),
            payment_count=('order_no', 'count')
        ).reset_index()
        
        return analysis

    def get_big_break_analysis(self) -> pd.DataFrame:
        valid = self.df[~self.df['is_abnormal']].copy()
        
        if valid.empty:
            return pd.DataFrame()
        
        big_break = valid[valid['is_big_break']].copy()
        normal = valid[~valid['is_big_break']].copy()
        
        def summarize(df, label):
            if df.empty:
                return pd.DataFrame()
            return df.groupby(['window_id', 'floor']).agg(
                avg_total_wait=('total_wait', 'mean'),
                avg_serve_duration=('wait_serve', 'mean'),
                order_count=('order_no', 'count')
            ).reset_index().assign(period_type=label)
        
        bb_summary = summarize(big_break, 'big_break')
        normal_summary = summarize(normal, 'normal')
        
        combined = pd.concat([bb_summary, normal_summary], ignore_index=True)
        return combined


class ReviewMetrics:
    def __init__(self, reviews_df: pd.DataFrame, orders_df: pd.DataFrame = None):
        self.reviews_df = reviews_df.copy()
        self.reviews_df['create_time'] = pd.to_datetime(self.reviews_df['create_time'])
        self.orders_df = orders_df
        if orders_df is not None:
            self.orders_df = orders_df.copy()
            self.orders_df['queue_start_time'] = pd.to_datetime(self.orders_df['queue_start_time'])
        self.time_slicer = TimeSlicer()

    def analyze_rating_trends(self, window_id: int = None,
                              window_days: int = 7) -> pd.DataFrame:
        df = self.reviews_df.copy()
        
        if window_id is not None:
            df = df[df['window_id'] == window_id]
        
        if df.empty:
            return pd.DataFrame()
        
        df['date'] = df['create_time'].dt.date
        df['week'] = df['create_time'].dt.isocalendar().week
        
        daily = df.groupby(['date', 'window_id']).agg(
            avg_rating=('rating', 'mean'),
            review_count=('id', 'count'),
            low_rating_count=('rating', lambda x: (x <= 2).sum())
        ).reset_index()
        
        daily['rating_7d_ma'] = daily.groupby('window_id')['avg_rating'].transform(
            lambda x: x.rolling(window=window_days, min_periods=3).mean()
        )
        
        daily['rating_change'] = daily.groupby('window_id')['rating_7d_ma'].diff()
        daily['is_decline'] = daily['rating_change'] < -0.3
        
        return daily

    def get_review_decline_reasons(self, window_id: int = None,
                                   threshold: float = -0.3) -> pd.DataFrame:
        trends = self.analyze_rating_trends(window_id)
        
        if trends.empty:
            return pd.DataFrame()
        
        decline_periods = trends[trends['is_decline']]
        
        if decline_periods.empty:
            return pd.DataFrame()
        
        decline_reviews = []
        for _, period in decline_periods.iterrows():
            date = period['date']
            wid = period['window_id']
            
            window_reviews = self.reviews_df[
                (self.reviews_df['window_id'] == wid) &
                (self.reviews_df['create_time'].dt.date == date) &
                (self.reviews_df['rating'] <= 2)
            ]
            
            for _, review in window_reviews.iterrows():
                decline_reviews.append({
                    'date': date,
                    'window_id': wid,
                    'avg_rating': period['avg_rating'],
                    'rating_change': period['rating_change'],
                    'review_rating': review['rating'],
                    'comment': review['comment'],
                    'keywords': review.get('keywords', [])
                })
        
        return pd.DataFrame(decline_reviews)

    def get_keyword_frequency(self, window_id: int = None,
                              min_rating: int = None,
                              top_n: int = 50) -> pd.DataFrame:
        df = self.reviews_df.copy()
        
        if window_id is not None:
            df = df[df['window_id'] == window_id]
        
        if min_rating is not None:
            df = df[df['rating'] <= min_rating]
        
        if df.empty:
            return pd.DataFrame()
        
        all_keywords = []
        for keywords in df['keywords'].dropna():
            if isinstance(keywords, list):
                all_keywords.extend(keywords)
            elif isinstance(keywords, str):
                all_keywords.extend(eval(keywords))
        
        if not all_keywords:
            return pd.DataFrame()
        
        keyword_counts = pd.Series(all_keywords).value_counts().reset_index()
        keyword_counts.columns = ['keyword', 'count']
        
        return keyword_counts.head(top_n)

    def correlate_wait_with_rating(self) -> pd.DataFrame:
        if self.orders_df is None:
            return pd.DataFrame()
        
        merged = self.reviews_df.merge(
            self.orders_df[['id', 'total_wait', 'wait_queue', 'wait_serve', 
                           'wait_payment', 'window_id', 'time_slot', 'floor']],
            left_on='order_id',
            right_on='id',
            how='inner'
        )
        
        if merged.empty:
            return pd.DataFrame()
        
        merged['wait_bucket'] = pd.cut(merged['total_wait'], 
                                       bins=[0, 5, 10, 15, 20, 30, 60, 999],
                                       labels=['0-5', '5-10', '10-15', '15-20', '20-30', '30-60', '60+'])
        
        correlation = merged.groupby(['window_id', 'wait_bucket']).agg(
            avg_rating=('rating', 'mean'),
            review_count=('id_x', 'count')
        ).reset_index()
        
        return correlation
