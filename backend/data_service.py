import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from backend.config import Config
from backend.mock_data import MockDataStore
from backend.timescale_db import db_service

class DataService:
    def __init__(self):
        self.mock_store = MockDataStore()
        self.use_mock = Config.USE_MOCK_DATA
    
    def _apply_hour_range_filter(self, df: pd.DataFrame, hour_range: List[int], time_col: str = 'timestamp') -> pd.DataFrame:
        if not hour_range or len(hour_range) != 2:
            return df
        start_hour, end_hour = hour_range
        if time_col in df.columns:
            df = df[df[time_col].dt.hour.between(start_hour, end_hour)]
        return df
    
    def _apply_district_filter_to_station_data(self, df: pd.DataFrame, districts: List[str]) -> pd.DataFrame:
        if not districts:
            return df
        stations = self.get_stations()
        filtered_stations = stations[stations['district'].isin(districts)]['station_id'].tolist()
        if 'station_id' in df.columns:
            df = df[df['station_id'].isin(filtered_stations)]
        return df
    
    def _filter_dataframe(self, df: pd.DataFrame, filters: Dict[str, Any]) -> pd.DataFrame:
        result = df.copy()
        
        if 'start_time' in filters and filters['start_time'] is not None:
            result = result[result['timestamp'] >= pd.Timestamp(filters['start_time'])]
        
        if 'end_time' in filters and filters['end_time'] is not None:
            result = result[result['timestamp'] <= pd.Timestamp(filters['end_time'])]
        
        if 'station_ids' in filters and filters['station_ids']:
            result = result[result['station_id'].isin(filters['station_ids'])]
        
        if 'districts' in filters and filters['districts']:
            if 'district' in result.columns:
                result = result[result['district'].isin(filters['districts'])]
            elif 'station_id' in result.columns:
                result = self._apply_district_filter_to_station_data(result, filters['districts'])
        
        if 'hour_range' in filters and filters['hour_range']:
            result = self._apply_hour_range_filter(result, filters['hour_range'], 'timestamp')
        
        if 'exclude_anomalies' in filters and filters['exclude_anomalies']:
            if 'is_anomaly' in result.columns:
                result = result[~result['is_anomaly']]
        
        return result
    
    def get_stations(self, districts: Optional[List[str]] = None) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_stations(districts)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        stations = self.mock_store.stations.copy()
        if districts:
            stations = stations[stations['district'].isin(districts)]
        return stations
    
    def get_air_quality_raw(self, filters: Dict[str, Any]) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_air_quality_raw(filters)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        df = self.mock_store.air_quality.copy()
        return self._filter_dataframe(df, filters)
    
    def get_air_quality_hourly(self, filters: Dict[str, Any]) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_air_quality_hourly(filters)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        raw_data = self.get_air_quality_raw(filters)
        
        if raw_data.empty:
            return raw_data
        
        hourly = raw_data.copy()
        hourly['hour_bucket'] = hourly['timestamp'].dt.floor('h')
        
        if 'hour_range' in filters and filters['hour_range']:
            start_hour, end_hour = filters['hour_range']
            hourly = hourly[hourly['hour_bucket'].dt.hour.between(start_hour, end_hour)]
        
        pollutants = Config.POLLUTANTS
        agg_dict = {}
        
        for pollutant in pollutants:
            if pollutant in hourly.columns:
                agg_dict[f'{pollutant}_avg'] = (pollutant, 'mean')
                agg_dict[f'{pollutant}_median'] = (pollutant, 'median')
                agg_dict[f'{pollutant}_max'] = (pollutant, 'max')
                agg_dict[f'{pollutant}_min'] = (pollutant, 'min')
                agg_dict[f'{pollutant}_count'] = (pollutant, 'count')
        
        agg_dict['temperature_avg'] = ('temperature', 'mean')
        agg_dict['humidity_avg'] = ('humidity', 'mean')
        agg_dict['wind_direction_avg'] = ('wind_direction', 'mean')
        agg_dict['wind_speed_avg'] = ('wind_speed', 'mean')
        agg_dict['record_count'] = ('timestamp', 'count')
        agg_dict['anomaly_count'] = ('is_anomaly', 'sum')
        
        result = hourly.groupby(['hour_bucket', 'station_id']).agg(**agg_dict).reset_index()
        return result
    
    def get_air_quality_daily(self, filters: Dict[str, Any]) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_air_quality_daily(filters)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        raw_data = self.get_air_quality_raw(filters)
        
        if raw_data.empty:
            return raw_data
        
        daily = raw_data.copy()
        daily['day_bucket'] = daily['timestamp'].dt.floor('d')
        
        pollutants = Config.POLLUTANTS
        agg_dict = {}
        
        for pollutant in pollutants:
            if pollutant in daily.columns:
                agg_dict[f'{pollutant}_avg'] = (pollutant, 'mean')
                agg_dict[f'{pollutant}_median'] = (pollutant, 'median')
                agg_dict[f'{pollutant}_max'] = (pollutant, 'max')
                agg_dict[f'{pollutant}_min'] = (pollutant, 'min')
                agg_dict[f'{pollutant}_count'] = (pollutant, 'count')
        
        agg_dict['record_count'] = ('timestamp', 'count')
        agg_dict['anomaly_count'] = ('is_anomaly', 'sum')
        
        result = daily.groupby(['day_bucket', 'station_id']).agg(**agg_dict).reset_index()
        return result
    
    def get_traffic_data(self, filters: Dict[str, Any]) -> pd.DataFrame:
        df = self.mock_store.traffic.copy()
        return self._filter_dataframe(df, filters)
    
    def get_traffic_hourly(self, filters: Dict[str, Any]) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_traffic_hourly(filters)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        raw_data = self.get_traffic_data(filters)
        
        if raw_data.empty:
            return raw_data
        
        hourly = raw_data.copy()
        hourly['hour_bucket'] = hourly['timestamp'].dt.floor('h')
        
        if 'hour_range' in filters and filters['hour_range']:
            start_hour, end_hour = filters['hour_range']
            hourly = hourly[hourly['hour_bucket'].dt.hour.between(start_hour, end_hour)]
        
        result = hourly.groupby(['hour_bucket', 'station_id']).agg(
            vehicle_count_avg=('vehicle_count', 'mean'),
            vehicle_count_sum=('vehicle_count', 'sum'),
            average_speed_avg=('average_speed', 'mean'),
            record_count=('timestamp', 'count')
        ).reset_index()
        
        return result
    
    def get_construction_sites(self, districts: Optional[List[str]] = None, active_only: bool = True) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_construction_sites(districts, active_only)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        sites = self.mock_store.construction_sites.copy()
        if districts:
            sites = sites[sites['district'].isin(districts)]
        if active_only:
            sites = sites[sites['is_active'] == True]
        return sites
    
    def get_complaints(self, filters: Dict[str, Any], is_public: bool = True) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_complaints(filters, is_public)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        complaints = self.mock_store.complaints.copy()
        
        if 'districts' in filters and filters['districts']:
            complaints = complaints[complaints['district'].isin(filters['districts'])]
        
        if 'complaint_types' in filters and filters['complaint_types']:
            complaints = complaints[complaints['complaint_type'].isin(filters['complaint_types'])]
        
        if 'start_time' in filters and filters['start_time'] is not None:
            complaints = complaints[complaints['timestamp'] >= pd.Timestamp(filters['start_time'])]
        
        if 'end_time' in filters and filters['end_time'] is not None:
            complaints = complaints[complaints['timestamp'] <= pd.Timestamp(filters['end_time'])]
        
        if filters.get('verified_only', False):
            complaints = complaints[complaints['is_verified'] == True]
        
        if is_public:
            complaints = complaints.copy()
            complaints.loc[~complaints['is_verified'], 'reporter_name'] = None
            complaints.loc[~complaints['is_verified'], 'reporter_contact'] = None
            complaints.loc[~complaints['is_verified'], 'description'] = '待核实投诉详情暂不公开'
        
        return complaints
    
    def get_events(self, filters: Dict[str, Any]) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_events(filters)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        events = self.mock_store.events.copy()
        
        if 'event_types' in filters and filters['event_types']:
            events = events[events['event_type'].isin(filters['event_types'])]
        
        if 'districts' in filters and filters['districts']:
            events = events[events['district'].isin(filters['districts']) | events['district'].isna()]
        
        if 'start_time' in filters and filters['start_time'] is not None:
            events = events[events['end_time'] >= pd.Timestamp(filters['start_time'])]
        
        if 'end_time' in filters and filters['end_time'] is not None:
            events = events[events['start_time'] <= pd.Timestamp(filters['end_time'])]
        
        return events
    
    def get_anomaly_records(self, filters: Dict[str, Any]) -> pd.DataFrame:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_anomaly_records(filters)
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        raw_data = self.get_air_quality_raw(filters)
        anomalies = raw_data[raw_data['is_anomaly'] == True].copy()
        return anomalies
    
    def get_pollutant_comparison(self, filters: Dict[str, Any], pollutants: List[str]) -> pd.DataFrame:
        hourly = self.get_air_quality_hourly(filters)
        
        if hourly.empty:
            return hourly
        
        result_data = []
        for _, row in hourly.iterrows():
            for pollutant in pollutants:
                col = f'{pollutant}_avg'
                if col in row:
                    result_data.append({
                        'time_bucket': row['hour_bucket'],
                        'station_id': row['station_id'],
                        'pollutant': pollutant,
                        'value': row[col]
                    })
        
        return pd.DataFrame(result_data)
    
    def get_district_aggregation(self, filters: Dict[str, Any]) -> pd.DataFrame:
        stations = self.get_stations()
        hourly = self.get_air_quality_hourly(filters)
        
        if hourly.empty:
            return hourly
        
        merged = hourly.merge(stations[['station_id', 'district']], on='station_id', how='left')
        
        pollutants = Config.POLLUTANTS
        agg_dict = {}
        for pollutant in pollutants:
            col = f'{pollutant}_avg'
            if col in merged.columns:
                agg_dict[col] = 'mean'
        
        agg_dict['record_count'] = 'sum'
        
        result = merged.groupby('district').agg(**agg_dict).reset_index()
        return result
    
    def get_last_updated(self) -> Dict[str, Any]:
        if not self.use_mock and db_service.is_connected():
            try:
                return db_service.get_last_updated()
            except Exception as e:
                print(f"DB error, falling back to mock: {e}")
        
        return {
            'air_quality': {
                'last_updated': self.mock_store.last_updated.isoformat(),
                'record_count': len(self.mock_store.air_quality),
                'source': 'city_monitoring_network'
            },
            'traffic': {
                'last_updated': self.mock_store.last_updated.isoformat(),
                'record_count': len(self.mock_store.traffic),
                'source': 'traffic_management_bureau'
            },
            'complaints': {
                'last_updated': self.mock_store.last_updated.isoformat(),
                'record_count': len(self.mock_store.complaints),
                'source': 'public_reporting_system'
            }
        }
    
    def verify_aggregation(self, filters: Dict[str, Any], sample_size: int = 5) -> Dict[str, Any]:
        raw_data = self.get_air_quality_raw(filters)
        hourly_data = self.get_air_quality_hourly(filters)
        
        if raw_data.empty or hourly_data.empty:
            return {'valid': False, 'error': 'No data to verify'}
        
        sample_hour = hourly_data['hour_bucket'].iloc[0]
        sample_station = hourly_data['station_id'].iloc[0]
        
        raw_sample = raw_data[
            (raw_data['timestamp'].dt.floor('h') == sample_hour) &
            (raw_data['station_id'] == sample_station)
        ]
        
        hourly_sample = hourly_data[
            (hourly_data['hour_bucket'] == sample_hour) &
            (hourly_data['station_id'] == sample_station)
        ]
        
        verification = {
            'valid': True,
            'sample_time': sample_hour.isoformat(),
            'sample_station_id': int(sample_station),
            'raw_record_count': len(raw_sample),
            'hourly_record_count': int(hourly_sample['record_count'].iloc[0]),
            'count_match': len(raw_sample) == int(hourly_sample['record_count'].iloc[0]),
            'pollutant_checks': {}
        }
        
        for pollutant in ['pm25', 'o3']:
            if pollutant in raw_sample.columns:
                raw_mean = raw_sample[pollutant].mean()
                hourly_mean = hourly_sample[f'{pollutant}_avg'].iloc[0]
                diff = abs(raw_mean - hourly_mean) if pd.notna(raw_mean) and pd.notna(hourly_mean) else None
                
                verification['pollutant_checks'][pollutant] = {
                    'raw_mean': float(raw_mean) if pd.notna(raw_mean) else None,
                    'hourly_mean': float(hourly_mean) if pd.notna(hourly_mean) else None,
                    'difference': float(diff) if diff is not None else None,
                    'match': diff < 0.01 if diff is not None else True
                }
        
        raw_records_sample = raw_sample.head(sample_size).to_dict('records')
        for r in raw_records_sample:
            r['timestamp'] = r['timestamp'].isoformat()
        
        verification['raw_records_sample'] = raw_records_sample
        
        return verification
    
    def get_hourly_profile(self, filters: Dict[str, Any], pollutant: str = 'pm25') -> pd.DataFrame:
        raw_data = self.get_air_quality_raw(filters)
        
        if raw_data.empty:
            return raw_data
        
        data = raw_data.copy()
        data['hour'] = data['timestamp'].dt.hour
        data['weekday'] = data['timestamp'].dt.weekday
        
        if 'hour_range' in filters and filters['hour_range']:
            start_hour, end_hour = filters['hour_range']
            data = data[data['hour'].between(start_hour, end_hour)]
        
        hourly_profile = data.groupby('hour').agg(
            avg_value=(pollutant, 'mean'),
            median_value=(pollutant, 'median'),
            p75_value=(pollutant, lambda x: x.quantile(0.75)),
            p25_value=(pollutant, lambda x: x.quantile(0.25)),
            count=(pollutant, 'count')
        ).reset_index()
        
        return hourly_profile
    
    def get_wind_analysis(self, filters: Dict[str, Any], pollutant: str = 'pm25') -> pd.DataFrame:
        raw_data = self.get_air_quality_raw(filters)
        
        if raw_data.empty:
            return raw_data
        
        data = raw_data.copy()
        data['wind_direction_bin'] = (data['wind_direction'] // 30) * 30
        
        wind_data = data.groupby('wind_direction_bin').agg(
            avg_pollutant=(pollutant, 'mean'),
            avg_wind_speed=('wind_speed', 'mean'),
            count=('timestamp', 'count')
        ).reset_index()
        
        return wind_data

data_service = DataService()
