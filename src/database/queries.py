import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import text, and_, or_
from typing import Optional, List, Dict, Tuple
from .connection import get_session
from .models import Order, Window, Dish, Review, WindowOutage
from ..analysis.time_slicer import TimeSlicer


class QueryLayer:
    def __init__(self, use_mock: bool = True, mock_data: Dict = None):
        self.use_mock = use_mock
        self.mock_data = mock_data or {}
        self.time_slicer = TimeSlicer()

    def _get_orders_df(self) -> pd.DataFrame:
        if self.use_mock and 'orders' in self.mock_data:
            return self.mock_data['orders'].copy()
        session = get_session()
        try:
            query = session.query(Order)
            return pd.read_sql(query.statement, session.bind)
        finally:
            session.close()

    def _get_windows_df(self) -> pd.DataFrame:
        if self.use_mock and 'windows' in self.mock_data:
            return self.mock_data['windows'].copy()
        session = get_session()
        try:
            query = session.query(Window)
            return pd.read_sql(query.statement, session.bind)
        finally:
            session.close()

    def _get_dishes_df(self) -> pd.DataFrame:
        if self.use_mock and 'dishes' in self.mock_data:
            return self.mock_data['dishes'].copy()
        session = get_session()
        try:
            query = session.query(Dish)
            return pd.read_sql(query.statement, session.bind)
        finally:
            session.close()

    def _get_reviews_df(self) -> pd.DataFrame:
        if self.use_mock and 'reviews' in self.mock_data:
            return self.mock_data['reviews'].copy()
        session = get_session()
        try:
            query = session.query(Review)
            return pd.read_sql(query.statement, session.bind)
        finally:
            session.close()

    def _get_outages_df(self) -> pd.DataFrame:
        if self.use_mock and 'outages' in self.mock_data:
            return self.mock_data['outages'].copy()
        session = get_session()
        try:
            query = session.query(WindowOutage)
            return pd.read_sql(query.statement, session.bind)
        finally:
            session.close()

    def get_window_heatmap_data(self, 
                                 date: datetime.date,
                                 floor: Optional[int] = None,
                                 time_slot: Optional[str] = None,
                                 bucket_minutes: int = 10) -> pd.DataFrame:
        orders = self._get_orders_df()
        orders['queue_start_time'] = pd.to_datetime(orders['queue_start_time'])
        
        filtered = orders[orders['queue_start_time'].dt.date == date]
        
        if floor is not None and floor != 'all':
            filtered = filtered[filtered['floor'] == floor]
        
        if time_slot is not None and time_slot != 'all':
            filtered = filtered[filtered['time_slot'] == time_slot]
        
        filtered = filtered[~filtered['is_abnormal']]
        
        if filtered.empty:
            return pd.DataFrame()
        
        filtered['time_bucket'] = filtered['queue_start_time'].apply(
            lambda x: self.time_slicer.get_time_bucket(x, bucket_minutes)
        )
        
        pivot = filtered.pivot_table(
            index='window_id',
            columns='time_bucket',
            values='total_wait',
            aggfunc='mean'
        ).fillna(0)
        
        return pivot.reset_index()

    def get_window_aggregate_metrics(self,
                                      start_date: datetime.date,
                                      end_date: datetime.date,
                                      group_by: List[str] = None,
                                      exclude_abnormal: bool = True) -> pd.DataFrame:
        if group_by is None:
            group_by = ['window_id', 'floor', 'time_slot']
        
        orders = self._get_orders_df()
        orders['queue_start_time'] = pd.to_datetime(orders['queue_start_time'])
        
        filtered = orders[
            (orders['queue_start_time'].dt.date >= start_date) &
            (orders['queue_start_time'].dt.date <= end_date)
        ]
        
        if exclude_abnormal:
            filtered = filtered[~filtered['is_abnormal']]
        
        if filtered.empty:
            return pd.DataFrame()
        
        metrics = filtered.groupby(group_by).agg(
            order_count=('order_no', 'count'),
            avg_wait_queue=('wait_queue', 'mean'),
            median_wait_queue=('wait_queue', 'median'),
            p95_wait_queue=('wait_queue', lambda x: x.quantile(0.95)),
            avg_wait_payment=('wait_payment', 'mean'),
            avg_wait_serve=('wait_serve', 'mean'),
            avg_total_wait=('total_wait', 'mean'),
            p95_total_wait=('total_wait', lambda x: x.quantile(0.95))
        ).reset_index()
        
        return metrics

    def get_big_break_comparison(self,
                                  start_date: datetime.date = None,
                                  end_date: datetime.date = None) -> pd.DataFrame:
        orders = self._get_orders_df()
        orders['queue_start_time'] = pd.to_datetime(orders['queue_start_time'])
        
        filtered = orders[~orders['is_abnormal']]
        
        if start_date:
            filtered = filtered[filtered['queue_start_time'].dt.date >= start_date]
        if end_date:
            filtered = filtered[filtered['queue_start_time'].dt.date <= end_date]
        
        if filtered.empty:
            return pd.DataFrame()
        
        comparison = filtered.groupby(['window_id', 'floor', 'is_big_break']).agg(
            order_count=('order_no', 'count'),
            avg_total_wait=('total_wait', 'mean'),
            avg_serve_duration=('wait_serve', 'mean')
        ).reset_index()
        
        return comparison

    def get_window_raw_timeline(self,
                                 window_id: int,
                                 date: datetime.date,
                                 include_abnormal: bool = False) -> pd.DataFrame:
        orders = self._get_orders_df()
        orders['queue_start_time'] = pd.to_datetime(orders['queue_start_time'])
        orders['payment_time'] = pd.to_datetime(orders['payment_time'])
        orders['serve_time'] = pd.to_datetime(orders['serve_time'])
        
        filtered = orders[
            (orders['window_id'] == window_id) &
            (orders['queue_start_time'].dt.date == date)
        ]
        
        if not include_abnormal:
            filtered = filtered[~filtered['is_abnormal']]
        
        filtered = filtered.sort_values('queue_start_time')
        
        return filtered

    def get_dish_distribution(self,
                               window_id: int = None,
                               date: datetime.date = None,
                               exclude_abnormal: bool = True) -> pd.DataFrame:
        orders = self._get_orders_df()
        orders['queue_start_time'] = pd.to_datetime(orders['queue_start_time'])
        
        filtered = orders.copy()
        
        if date:
            filtered = filtered[filtered['queue_start_time'].dt.date == date]
        if window_id is not None and window_id != 'all':
            filtered = filtered[filtered['window_id'] == window_id]
        if exclude_abnormal:
            filtered = filtered[~filtered['is_abnormal']]
        
        if filtered.empty:
            return pd.DataFrame()
        
        dist = filtered.groupby(['dish_id', 'window_id']).agg(
            serve_count=('order_no', 'count'),
            avg_serve_time=('wait_serve', 'mean'),
            avg_total_wait=('total_wait', 'mean')
        ).reset_index()
        
        return dist

    def get_payment_wait_analysis(self,
                                   floor: int = None,
                                   time_slot: str = None) -> pd.DataFrame:
        orders = self._get_orders_df()
        orders['queue_start_time'] = pd.to_datetime(orders['queue_start_time'])
        
        filtered = orders[~orders['is_abnormal']]
        
        if floor is not None and floor != 'all':
            filtered = filtered[filtered['floor'] == floor]
        if time_slot is not None and time_slot != 'all':
            filtered = filtered[filtered['time_slot'] == time_slot]
        
        if filtered.empty:
            return pd.DataFrame()
        
        analysis = filtered.groupby(['window_id', 'floor', 'time_slot', 'is_big_break']).agg(
            avg_payment_wait=('wait_payment', 'mean'),
            median_payment_wait=('wait_payment', 'median'),
            p95_payment_wait=('wait_payment', lambda x: x.quantile(0.95)),
            payment_count=('order_no', 'count')
        ).reset_index()
        
        return analysis

    def get_rating_trends(self,
                           window_id: int = None,
                           window_days: int = 7) -> pd.DataFrame:
        reviews = self._get_reviews_df()
        reviews['create_time'] = pd.to_datetime(reviews['create_time'])
        
        if window_id is not None and window_id != 'all':
            reviews = reviews[reviews['window_id'] == window_id]
        
        if reviews.empty:
            return pd.DataFrame()
        
        reviews['date'] = reviews['create_time'].dt.date
        
        daily = reviews.groupby(['date', 'window_id']).agg(
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

    def get_floor_baseline_metrics(self,
                                    floor: int,
                                    time_slot: str,
                                    metric_col: str = 'total_wait') -> Dict:
        orders = self._get_orders_df()
        filtered = orders[
            (orders['floor'] == floor) &
            (orders['time_slot'] == time_slot) &
            (~orders['is_abnormal'])
        ]
        
        if filtered.empty:
            return {'mean': None, 'median': None, 'p95': None, 'count': 0}
        
        return {
            'mean': filtered[metric_col].mean(),
            'median': filtered[metric_col].median(),
            'p95': filtered[metric_col].quantile(0.95),
            'count': len(filtered)
        }
