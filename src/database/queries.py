import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import text, and_, or_
from typing import Optional, List, Dict, Tuple
from .connection import get_session, get_engine
from .models import Order, Window, Dish, Review, WindowOutage
from .schema import refresh_continuous_views
from ..analysis.time_slicer import TimeSlicer


class QueryLayer:
    def __init__(self, use_mock: bool = True, mock_data: Dict = None):
        self.use_mock = use_mock
        self.mock_data = mock_data or {}
        self.time_slicer = TimeSlicer()
        self.engine = get_engine() if not use_mock else None

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
        if self.use_mock:
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
                lambda x: self.time_slicer.get_time_bucket(x, bucket_minutes).strftime('%H:%M')
            )

            pivot = filtered.pivot_table(
                index='window_id',
                columns='time_bucket',
                values='total_wait',
                aggfunc='mean'
            ).fillna(0)

            return pivot.reset_index()
        else:
            start_dt = datetime.combine(date, datetime.min.time())
            end_dt = start_dt + timedelta(days=1)

            conditions = []
            params = {"start_dt": start_dt, "end_dt": end_dt}

            if floor is not None and floor != 'all':
                conditions.append("o.floor = :floor")
                params["floor"] = floor

            if time_slot is not None and time_slot != 'all':
                conditions.append("o.time_slot = :time_slot")
                params["time_slot"] = time_slot

            where_clause = " AND ".join(conditions) if conditions else "1=1"

            sql = text(f"""
                SELECT
                    o.window_id,
                    time_bucket(:bucket_interval, o.queue_start_time) AS bucket,
                    AVG(o.total_wait) AS avg_total_wait
                FROM orders o
                WHERE o.queue_start_time >= :start_dt
                  AND o.queue_start_time < :end_dt
                  AND o.is_abnormal = FALSE
                  AND {where_clause}
                GROUP BY o.window_id, time_bucket(:bucket_interval, o.queue_start_time)
                ORDER BY bucket
            """)
            params["bucket_interval"] = f"{bucket_minutes} minutes"

            df = pd.read_sql(sql, self.engine, params=params)

            if df.empty:
                return pd.DataFrame()

            df['time_bucket'] = pd.to_datetime(df['bucket']).dt.strftime('%H:%M')

            pivot = df.pivot_table(
                index='window_id',
                columns='time_bucket',
                values='avg_total_wait',
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

        if self.use_mock:
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
        else:
            start_dt = datetime.combine(start_date, datetime.min.time())
            end_dt = datetime.combine(end_date, datetime.max.time())

            group_cols = ", ".join([f"o.{g}" for g in group_by])
            abnormal_filter = "AND o.is_abnormal = FALSE" if exclude_abnormal else ""

            sql = text(f"""
                SELECT
                    {group_cols},
                    COUNT(*) AS order_count,
                    AVG(o.wait_queue) AS avg_wait_queue,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.wait_queue) AS median_wait_queue,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY o.wait_queue) AS p95_wait_queue,
                    AVG(o.wait_payment) AS avg_wait_payment,
                    AVG(o.wait_serve) AS avg_wait_serve,
                    AVG(o.total_wait) AS avg_total_wait,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY o.total_wait) AS p95_total_wait
                FROM orders o
                WHERE o.queue_start_time >= :start_dt
                  AND o.queue_start_time <= :end_dt
                  {abnormal_filter}
                GROUP BY {group_cols}
                ORDER BY {group_cols}
            """)

            df = pd.read_sql(sql, self.engine, params={"start_dt": start_dt, "end_dt": end_dt})
            return df

    def get_big_break_comparison(self,
                                  start_date: datetime.date = None,
                                  end_date: datetime.date = None) -> pd.DataFrame:
        if self.use_mock:
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
        else:
            where_conditions = ["o.is_abnormal = FALSE"]
            params = {}

            if start_date:
                start_dt = datetime.combine(start_date, datetime.min.time())
                where_conditions.append("o.queue_start_time >= :start_dt")
                params["start_dt"] = start_dt

            if end_date:
                end_dt = datetime.combine(end_date, datetime.max.time())
                where_conditions.append("o.queue_start_time <= :end_dt")
                params["end_dt"] = end_dt

            where_clause = " AND ".join(where_conditions)

            sql = text(f"""
                SELECT
                    o.window_id,
                    o.floor,
                    o.is_big_break,
                    COUNT(*) AS order_count,
                    AVG(o.total_wait) AS avg_total_wait,
                    AVG(o.wait_serve) AS avg_serve_duration
                FROM orders o
                WHERE {where_clause}
                GROUP BY o.window_id, o.floor, o.is_big_break
                ORDER BY o.window_id, o.is_big_break
            """)

            df = pd.read_sql(sql, self.engine, params=params)
            return df

    def get_window_raw_timeline(self,
                                 window_id: int,
                                 date: datetime.date,
                                 include_abnormal: bool = False) -> pd.DataFrame:
        if self.use_mock:
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
        else:
            start_dt = datetime.combine(date, datetime.min.time())
            end_dt = start_dt + timedelta(days=1)

            abnormal_filter = "" if include_abnormal else "AND o.is_abnormal = FALSE"

            sql = text(f"""
                SELECT
                    o.id,
                    o.order_no,
                    o.window_id,
                    o.dish_id,
                    o.student_id,
                    o.queue_start_time,
                    o.payment_time,
                    o.serve_time,
                    o.amount,
                    o.item_count,
                    o.is_abnormal,
                    o.abnormal_reason,
                    o.wait_queue,
                    o.wait_payment,
                    o.wait_serve,
                    o.total_wait,
                    o.time_slot,
                    o.floor,
                    o.is_big_break
                FROM orders o
                WHERE o.window_id = :window_id
                  AND o.queue_start_time >= :start_dt
                  AND o.queue_start_time < :end_dt
                  {abnormal_filter}
                ORDER BY o.queue_start_time ASC
            """)

            df = pd.read_sql(sql, self.engine, params={
                "window_id": window_id,
                "start_dt": start_dt,
                "end_dt": end_dt
            })

            return df

    def get_dish_distribution(self,
                               window_id: int = None,
                               date: datetime.date = None,
                               exclude_abnormal: bool = True) -> pd.DataFrame:
        if self.use_mock:
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
        else:
            where_conditions = []
            params = {}

            if date:
                start_dt = datetime.combine(date, datetime.min.time())
                end_dt = start_dt + timedelta(days=1)
                where_conditions.append("o.queue_start_time >= :start_dt")
                where_conditions.append("o.queue_start_time < :end_dt")
                params["start_dt"] = start_dt
                params["end_dt"] = end_dt

            if window_id is not None and window_id != 'all':
                where_conditions.append("o.window_id = :window_id")
                params["window_id"] = window_id

            if exclude_abnormal:
                where_conditions.append("o.is_abnormal = FALSE")

            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

            sql = text(f"""
                SELECT
                    o.dish_id,
                    o.window_id,
                    COUNT(*) AS serve_count,
                    AVG(o.wait_serve) AS avg_serve_time,
                    AVG(o.total_wait) AS avg_total_wait
                FROM orders o
                WHERE {where_clause}
                GROUP BY o.dish_id, o.window_id
                ORDER BY serve_count DESC
            """)

            df = pd.read_sql(sql, self.engine, params=params)
            return df

    def get_payment_wait_analysis(self,
                                   floor: int = None,
                                   time_slot: str = None) -> pd.DataFrame:
        if self.use_mock:
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
        else:
            where_conditions = ["o.is_abnormal = FALSE"]
            params = {}

            if floor is not None and floor != 'all':
                where_conditions.append("o.floor = :floor")
                params["floor"] = floor

            if time_slot is not None and time_slot != 'all':
                where_conditions.append("o.time_slot = :time_slot")
                params["time_slot"] = time_slot

            where_clause = " AND ".join(where_conditions)

            sql = text(f"""
                SELECT
                    o.window_id,
                    o.floor,
                    o.time_slot,
                    o.is_big_break,
                    AVG(o.wait_payment) AS avg_payment_wait,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.wait_payment) AS median_payment_wait,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY o.wait_payment) AS p95_payment_wait,
                    COUNT(*) AS payment_count
                FROM orders o
                WHERE {where_clause}
                GROUP BY o.window_id, o.floor, o.time_slot, o.is_big_break
                ORDER BY o.window_id, o.time_slot, o.is_big_break
            """)

            df = pd.read_sql(sql, self.engine, params=params)
            return df

    def get_rating_trends(self,
                           window_id: int = None,
                           window_days: int = 7) -> pd.DataFrame:
        if self.use_mock:
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
        else:
            where_conditions = []
            params = {"window_days": window_days}

            if window_id is not None and window_id != 'all':
                where_conditions.append("r.window_id = :window_id")
                params["window_id"] = window_id

            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

            sql = text(f"""
                WITH daily_stats AS (
                    SELECT
                        DATE(r.create_time) AS date,
                        r.window_id,
                        AVG(r.rating) AS avg_rating,
                        COUNT(*) AS review_count,
                        SUM(CASE WHEN r.rating <= 2 THEN 1 ELSE 0 END) AS low_rating_count
                    FROM reviews r
                    WHERE {where_clause}
                    GROUP BY DATE(r.create_time), r.window_id
                )
                SELECT
                    date,
                    window_id,
                    avg_rating,
                    review_count,
                    low_rating_count,
                    AVG(avg_rating) OVER (
                        PARTITION BY window_id
                        ORDER BY date
                        ROWS BETWEEN :window_days - 1 PRECEDING AND CURRENT ROW
                    ) AS rating_7d_ma,
                    avg_rating - LAG(avg_rating, 1) OVER (
                        PARTITION BY window_id ORDER BY date
                    ) AS rating_change,
                    (avg_rating - LAG(avg_rating, 1) OVER (
                        PARTITION BY window_id ORDER BY date
                    )) < -0.3 AS is_decline
                FROM daily_stats
                ORDER BY date DESC
            """)

            df = pd.read_sql(sql, self.engine, params=params)
            return df

    def get_floor_baseline_metrics(self,
                                    floor: int,
                                    time_slot: str,
                                    metric_col: str = 'total_wait') -> Dict:
        if self.use_mock:
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
        else:
            valid_cols = ['total_wait', 'wait_queue', 'wait_payment', 'wait_serve']
            col = metric_col if metric_col in valid_cols else 'total_wait'

            sql = text(f"""
                SELECT
                    AVG(o.{col}) AS mean_val,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.{col}) AS median_val,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY o.{col}) AS p95_val,
                    COUNT(*) AS count_val
                FROM orders o
                WHERE o.floor = :floor
                  AND o.time_slot = :time_slot
                  AND o.is_abnormal = FALSE
            """)

            df = pd.read_sql(sql, self.engine, params={"floor": floor, "time_slot": time_slot})

            if df.empty or df['count_val'].iloc[0] == 0:
                return {'mean': None, 'median': None, 'p95': None, 'count': 0}

            row = df.iloc[0]
            return {
                'mean': float(row['mean_val']),
                'median': float(row['median_val']),
                'p95': float(row['p95_val']),
                'count': int(row['count_val'])
            }

    def refresh_caches(self) -> Tuple[bool, str]:
        if self.use_mock:
            return True, "模拟数据模式，无需刷新数据库视图"
        
        errors = []
        
        try:
            refresh_continuous_views()
        except Exception as e:
            errors.append(f"连续聚合视图刷新失败: {str(e)}")
        
        if errors:
            return False, "; ".join(errors)
        
        return True, "数据库连续聚合视图刷新成功"

    def get_queue_start_patterns(self) -> pd.DataFrame:
        if self.use_mock:
            from ..analysis.metrics import QueueMetrics
            orders = self._get_orders_df()
            metrics = QueueMetrics(orders)
            return metrics.analyze_queue_start_patterns()
        else:
            sql = text("""
                SELECT
                    window_id,
                    floor,
                    time_slot,
                    AVG(EXTRACT(EPOCH FROM queue_start_time::time) / 60) AS avg_queue_start,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM queue_start_time::time) / 60) AS median_queue_start,
                    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM queue_start_time::time) / 60) AS p25_queue_start,
                    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM queue_start_time::time) / 60) AS p75_queue_start,
                    MIN(EXTRACT(EPOCH FROM queue_start_time::time) / 60) AS earliest_queue,
                    MAX(EXTRACT(EPOCH FROM queue_start_time::time) / 60) AS latest_queue,
                    COUNT(*) AS queue_count
                FROM orders
                WHERE is_abnormal = FALSE
                GROUP BY window_id, floor, time_slot
                ORDER BY window_id, time_slot
            """)

            df = pd.read_sql(sql, self.engine)
            
            if not df.empty:
                def minutes_to_time(m):
                    if pd.isna(m):
                        return None
                    h = int(m // 60)
                    mi = int(m % 60)
                    return f"{h:02d}:{mi:02d}"
                
                for col in ['avg_queue_start', 'median_queue_start', 'p25_queue_start',
                            'p75_queue_start', 'earliest_queue', 'latest_queue']:
                    df[col + '_time'] = df[col].apply(minutes_to_time)
            
            return df

    def get_serve_patterns(self) -> pd.DataFrame:
        if self.use_mock:
            from ..analysis.metrics import ServeMetrics
            orders = self._get_orders_df()
            metrics = ServeMetrics(orders)
            return metrics.analyze_serve_patterns()
        else:
            sql = text("""
                SELECT
                    window_id,
                    floor,
                    time_slot,
                    AVG(EXTRACT(EPOCH FROM serve_time::time) / 60) AS avg_serve_time,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM serve_time::time) / 60) AS median_serve_time,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM serve_time::time) / 60) AS p95_serve_time,
                    AVG(wait_serve) AS avg_serve_duration,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY wait_serve) AS p95_serve_duration,
                    COUNT(*) AS serve_count,
                    AVG(wait_payment) AS avg_payment_wait
                FROM orders
                WHERE is_abnormal = FALSE
                  AND serve_time IS NOT NULL
                GROUP BY window_id, floor, time_slot
                ORDER BY window_id, time_slot
            """)

            df = pd.read_sql(sql, self.engine)
            
            if not df.empty:
                def minutes_to_time(m):
                    if pd.isna(m):
                        return None
                    h = int(m // 60)
                    mi = int(m % 60)
                    return f"{h:02d}:{mi:02d}"
                
                df['avg_serve_time_str'] = df['avg_serve_time'].apply(minutes_to_time)
                df['median_serve_time_str'] = df['median_serve_time'].apply(minutes_to_time)
            
            return df

    def get_review_keywords(self, window_id: int = None, min_rating: int = None, top_n: int = 50) -> pd.DataFrame:
        if self.use_mock:
            from ..analysis.metrics import ReviewMetrics
            reviews = self._get_reviews_df()
            orders = self._get_orders_df()
            metrics = ReviewMetrics(reviews, orders)
            return metrics.get_keyword_frequency(window_id=window_id, min_rating=min_rating, top_n=top_n)
        else:
            where_conditions = []
            params = {"top_n": top_n}
            
            if window_id is not None:
                where_conditions.append("window_id = :window_id")
                params["window_id"] = window_id
            
            if min_rating is not None:
                where_conditions.append("rating <= :min_rating")
                params["min_rating"] = min_rating
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            sql = text(f"""
                WITH keyword_list AS (
                    SELECT
                        jsonb_array_elements_text(keywords) AS keyword
                    FROM reviews
                    WHERE {where_clause}
                      AND keywords IS NOT NULL
                      AND jsonb_typeof(keywords) = 'array'
                )
                SELECT
                    keyword,
                    COUNT(*) AS count
                FROM keyword_list
                GROUP BY keyword
                ORDER BY count DESC
                LIMIT :top_n
            """)
            
            df = pd.read_sql(sql, self.engine, params=params)
            return df

    def get_orders_for_export(self,
                               date: datetime.date = None,
                               floor: int = None,
                               time_slot: str = None,
                               limit: int = 10000) -> pd.DataFrame:
        if self.use_mock:
            orders = self._get_orders_df()
            orders['queue_start_time'] = pd.to_datetime(orders['queue_start_time'])
            
            filtered = orders.copy()
            
            if date:
                filtered = filtered[filtered['queue_start_time'].dt.date == date]
            if floor is not None and floor != 'all':
                filtered = filtered[filtered['floor'] == floor]
            if time_slot is not None and time_slot != 'all':
                filtered = filtered[filtered['time_slot'] == time_slot]
            
            return filtered.head(limit)
        else:
            where_conditions = []
            params = {"limit": limit}
            
            if date:
                start_dt = datetime.combine(date, datetime.min.time())
                end_dt = start_dt + timedelta(days=1)
                where_conditions.append("queue_start_time >= :start_dt")
                where_conditions.append("queue_start_time < :end_dt")
                params["start_dt"] = start_dt
                params["end_dt"] = end_dt
            
            if floor is not None and floor != 'all':
                where_conditions.append("floor = :floor")
                params["floor"] = floor
            
            if time_slot is not None and time_slot != 'all':
                where_conditions.append("time_slot = :time_slot")
                params["time_slot"] = time_slot
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            sql = text(f"""
                SELECT * FROM orders
                WHERE {where_clause}
                ORDER BY queue_start_time DESC
                LIMIT :limit
            """)
            
            df = pd.read_sql(sql, self.engine, params=params)
            return df
