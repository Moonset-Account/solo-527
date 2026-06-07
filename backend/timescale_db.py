import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.config import Config

class TimescaleDBService:
    def __init__(self):
        self.engine = None
        self._connect()
    
    def _connect(self):
        try:
            self.engine = create_engine(Config.DATABASE_URL, pool_pre_ping=True)
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except Exception as e:
            print(f"Warning: Failed to connect to TimescaleDB: {e}")
            self.engine = None
    
    def is_connected(self) -> bool:
        if self.engine is None:
            return False
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except:
            return False
    
    def get_stations(self, districts: Optional[List[str]] = None) -> pd.DataFrame:
        query = "SELECT * FROM monitoring_stations WHERE is_active = true"
        params = {}
        
        if districts:
            placeholders = ', '.join([f':d{i}' for i in range(len(districts))])
            query += f" AND district IN ({placeholders})"
            params = {f'd{i}': d for i, d in enumerate(districts)}
        
        with self.engine.connect() as conn:
            return pd.read_sql(text(query), conn, params=params)
    
    def get_air_quality_raw(self, filters: Dict[str, Any]) -> pd.DataFrame:
        query = "SELECT a.* FROM air_quality_raw a WHERE 1=1"
        params = {}
        
        if 'districts' in filters and filters['districts']:
            placeholders = ', '.join([f':d{i}' for i in range(len(filters['districts']))])
            query += f" AND a.station_id IN (SELECT station_id FROM monitoring_stations WHERE district IN ({placeholders}))"
            params.update({f'd{i}': d for i, d in enumerate(filters['districts'])})
        
        if 'start_time' in filters and filters['start_time'] is not None:
            query += " AND a.timestamp >= :start_time"
            params['start_time'] = pd.Timestamp(filters['start_time'])
        
        if 'end_time' in filters and filters['end_time'] is not None:
            query += " AND a.timestamp <= :end_time"
            params['end_time'] = pd.Timestamp(filters['end_time'])
        
        if 'station_ids' in filters and filters['station_ids']:
            placeholders = ', '.join([f':s{i}' for i in range(len(filters['station_ids']))])
            query += f" AND a.station_id IN ({placeholders})"
            params.update({f's{i}': s for i, s in enumerate(filters['station_ids'])})
        
        if 'hour_range' in filters and filters['hour_range']:
            start_hour, end_hour = filters['hour_range']
            query += " AND EXTRACT(HOUR FROM a.timestamp) BETWEEN :start_hour AND :end_hour"
            params['start_hour'] = start_hour
            params['end_hour'] = end_hour
        
        if filters.get('exclude_anomalies', False):
            query += " AND a.is_anomaly = false"
        
        query += " ORDER BY a.timestamp DESC"
        
        with self.engine.connect() as conn:
            return pd.read_sql(text(query), conn, params=params)
    
    def get_air_quality_hourly(self, filters: Dict[str, Any]) -> pd.DataFrame:
        query = "SELECT h.* FROM air_quality_hourly h WHERE 1=1"
        params = {}
        
        if 'districts' in filters and filters['districts']:
            placeholders = ', '.join([f':d{i}' for i in range(len(filters['districts']))])
            query += f" AND h.station_id IN (SELECT station_id FROM monitoring_stations WHERE district IN ({placeholders}))"
            params.update({f'd{i}': d for i, d in enumerate(filters['districts'])})
        
        if 'start_time' in filters and filters['start_time'] is not None:
            query += " AND h.hour_bucket >= :start_time"
            params['start_time'] = pd.Timestamp(filters['start_time'])
        
        if 'end_time' in filters and filters['end_time'] is not None:
            query += " AND h.hour_bucket <= :end_time"
            params['end_time'] = pd.Timestamp(filters['end_time'])
        
        if 'station_ids' in filters and filters['station_ids']:
            placeholders = ', '.join([f':s{i}' for i in range(len(filters['station_ids']))])
            query += f" AND h.station_id IN ({placeholders})"
            params.update({f's{i}': s for i, s in enumerate(filters['station_ids'])})
        
        if 'hour_range' in filters and filters['hour_range']:
            start_hour, end_hour = filters['hour_range']
            query += " AND EXTRACT(HOUR FROM h.hour_bucket) BETWEEN :start_hour AND :end_hour"
            params['start_hour'] = start_hour
            params['end_hour'] = end_hour
        
        query += " ORDER BY h.hour_bucket ASC"
        
        with self.engine.connect() as conn:
            return pd.read_sql(text(query), conn, params=params)
    
    def get_air_quality_daily(self, filters: Dict[str, Any]) -> pd.DataFrame:
        query = "SELECT d.* FROM air_quality_daily d WHERE 1=1"
        params = {}
        
        if 'districts' in filters and filters['districts']:
            placeholders = ', '.join([f':d{i}' for i in range(len(filters['districts']))])
            query += f" AND d.station_id IN (SELECT station_id FROM monitoring_stations WHERE district IN ({placeholders}))"
            params.update({f'd{i}': d for i, d in enumerate(filters['districts'])})
        
        if 'start_time' in filters and filters['start_time'] is not None:
            query += " AND d.day_bucket >= :start_time"
            params['start_time'] = pd.Timestamp(filters['start_time'])
        
        if 'end_time' in filters and filters['end_time'] is not None:
            query += " AND d.day_bucket <= :end_time"
            params['end_time'] = pd.Timestamp(filters['end_time'])
        
        if 'station_ids' in filters and filters['station_ids']:
            placeholders = ', '.join([f':s{i}' for i in range(len(filters['station_ids']))])
            query += f" AND d.station_id IN ({placeholders})"
            params.update({f's{i}': s for i, s in enumerate(filters['station_ids'])})
        
        query += " ORDER BY d.day_bucket ASC"
        
        with self.engine.connect() as conn:
            return pd.read_sql(text(query), conn, params=params)
    
    def get_traffic_hourly(self, filters: Dict[str, Any]) -> pd.DataFrame:
        query = """
            SELECT 
                time_bucket('1 hour', t.timestamp) as hour_bucket,
                t.station_id,
                AVG(t.vehicle_count) as vehicle_count_avg,
                SUM(t.vehicle_count) as vehicle_count_sum,
                AVG(t.average_speed) as average_speed_avg,
                COUNT(*) as record_count
            FROM traffic_flow t WHERE 1=1
        """
        params = {}
        
        if 'districts' in filters and filters['districts']:
            placeholders = ', '.join([f':d{i}' for i in range(len(filters['districts']))])
            query += f" AND t.station_id IN (SELECT station_id FROM monitoring_stations WHERE district IN ({placeholders}))"
            params.update({f'd{i}': d for i, d in enumerate(filters['districts'])})
        
        if 'start_time' in filters and filters['start_time'] is not None:
            query += " AND t.timestamp >= :start_time"
            params['start_time'] = pd.Timestamp(filters['start_time'])
        
        if 'end_time' in filters and filters['end_time'] is not None:
            query += " AND t.timestamp <= :end_time"
            params['end_time'] = pd.Timestamp(filters['end_time'])
        
        if 'station_ids' in filters and filters['station_ids']:
            placeholders = ', '.join([f':s{i}' for i in range(len(filters['station_ids']))])
            query += f" AND t.station_id IN ({placeholders})"
            params.update({f's{i}': s for i, s in enumerate(filters['station_ids'])})
        
        if 'hour_range' in filters and filters['hour_range']:
            start_hour, end_hour = filters['hour_range']
            query += " AND EXTRACT(HOUR FROM t.timestamp) BETWEEN :start_hour AND :end_hour"
            params['start_hour'] = start_hour
            params['end_hour'] = end_hour
        
        query += " GROUP BY hour_bucket, t.station_id ORDER BY hour_bucket ASC"
        
        with self.engine.connect() as conn:
            return pd.read_sql(text(query), conn, params=params)
    
    def get_construction_sites(self, districts: Optional[List[str]] = None, active_only: bool = True) -> pd.DataFrame:
        query = "SELECT * FROM construction_sites WHERE 1=1"
        params = {}
        
        if active_only:
            query += " AND is_active = true"
        
        if districts:
            placeholders = ', '.join([f':d{i}' for i in range(len(districts))])
            query += f" AND district IN ({placeholders})"
            params = {f'd{i}': d for i, d in enumerate(districts)}
        
        with self.engine.connect() as conn:
            return pd.read_sql(text(query), conn, params=params)
    
    def get_complaints(self, filters: Dict[str, Any], is_public: bool = True) -> pd.DataFrame:
        if is_public:
            query = """
                SELECT 
                    complaint_id,
                    timestamp,
                    district,
                    complaint_type,
                    CASE WHEN is_verified = true THEN description ELSE '待核实投诉详情暂不公开' END as description,
                    latitude,
                    longitude,
                    is_verified,
                    verified_at,
                    CASE WHEN is_verified = true THEN reporter_name ELSE NULL END as reporter_name,
                    CASE WHEN is_verified = true THEN reporter_contact ELSE NULL END as reporter_contact,
                    created_at
                FROM complaint_records WHERE 1=1
            """
        else:
            query = "SELECT * FROM complaint_records WHERE 1=1"
        
        params = {}
        
        if 'districts' in filters and filters['districts']:
            placeholders = ', '.join([f':d{i}' for i in range(len(filters['districts']))])
            query += f" AND district IN ({placeholders})"
            params.update({f'd{i}': d for i, d in enumerate(filters['districts'])})
        
        if 'complaint_types' in filters and filters['complaint_types']:
            placeholders = ', '.join([f':ct{i}' for i in range(len(filters['complaint_types']))])
            query += f" AND complaint_type IN ({placeholders})"
            params.update({f'ct{i}': ct for i, ct in enumerate(filters['complaint_types'])})
        
        if 'start_time' in filters and filters['start_time'] is not None:
            query += " AND timestamp >= :start_time"
            params['start_time'] = pd.Timestamp(filters['start_time'])
        
        if 'end_time' in filters and filters['end_time'] is not None:
            query += " AND timestamp <= :end_time"
            params['end_time'] = pd.Timestamp(filters['end_time'])
        
        if filters.get('verified_only', False):
            query += " AND is_verified = true"
        
        query += " ORDER BY timestamp DESC"
        
        with self.engine.connect() as conn:
            return pd.read_sql(text(query), conn, params=params)
    
    def get_events(self, filters: Dict[str, Any]) -> pd.DataFrame:
        query = "SELECT * FROM event_annotations WHERE 1=1"
        params = {}
        
        if 'event_types' in filters and filters['event_types']:
            placeholders = ', '.join([f':et{i}' for i in range(len(filters['event_types']))])
            query += f" AND event_type IN ({placeholders})"
            params.update({f'et{i}': et for i, et in enumerate(filters['event_types'])})
        
        if 'districts' in filters and filters['districts']:
            placeholders = ', '.join([f':d{i}' for i in range(len(filters['districts']))])
            query += f" AND (district IN ({placeholders}) OR district IS NULL)"
            params.update({f'd{i}': d for i, d in enumerate(filters['districts'])})
        
        if 'start_time' in filters and filters['start_time'] is not None:
            query += " AND (end_time >= :start_time OR end_time IS NULL)"
            params['start_time'] = pd.Timestamp(filters['start_time'])
        
        if 'end_time' in filters and filters['end_time'] is not None:
            query += " AND start_time <= :end_time"
            params['end_time'] = pd.Timestamp(filters['end_time'])
        
        query += " ORDER BY start_time DESC"
        
        with self.engine.connect() as conn:
            return pd.read_sql(text(query), conn, params=params)
    
    def get_anomaly_records(self, filters: Dict[str, Any]) -> pd.DataFrame:
        filters_copy = filters.copy()
        filters_copy['exclude_anomalies'] = False
        
        raw = self.get_air_quality_raw(filters_copy)
        if not raw.empty:
            return raw[raw['is_anomaly'] == True].copy()
        return raw
    
    def get_last_updated(self) -> Dict[str, Any]:
        query = """
            SELECT data_type, last_updated, record_count, source 
            FROM data_update_log 
            ORDER BY created_at DESC 
            LIMIT 10
        """
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
        
        result = {}
        for _, row in df.iterrows():
            result[row['data_type']] = {
                'last_updated': row['last_updated'].isoformat() if pd.notna(row['last_updated']) else None,
                'record_count': int(row['record_count']) if pd.notna(row['record_count']) else 0,
                'source': row['source']
            }
        
        return result

db_service = TimescaleDBService()
