import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from backend.config import Config

def generate_mock_stations():
    stations = [
        {'station_id': 1, 'station_name': '朝阳区监测站', 'district': '朝阳区', 'latitude': 39.9219, 'longitude': 116.4438, 'station_type': 'standard'},
        {'station_id': 2, 'station_name': '海淀区监测站', 'district': '海淀区', 'latitude': 39.9599, 'longitude': 116.2985, 'station_type': 'standard'},
        {'station_id': 3, 'station_name': '东城区监测站', 'district': '东城区', 'latitude': 39.9289, 'longitude': 116.4165, 'station_type': 'standard'},
        {'station_id': 4, 'station_name': '西城区监测站', 'district': '西城区', 'latitude': 39.9155, 'longitude': 116.3643, 'station_type': 'standard'},
        {'station_id': 5, 'station_name': '丰台区监测站', 'district': '丰台区', 'latitude': 39.8586, 'longitude': 116.2869, 'station_type': 'standard'},
        {'station_id': 6, 'station_name': '石景山区监测站', 'district': '石景山区', 'latitude': 39.9058, 'longitude': 116.2228, 'station_type': 'standard'},
        {'station_id': 7, 'station_name': '通州区监测站', 'district': '通州区', 'latitude': 39.9088, 'longitude': 116.6568, 'station_type': 'standard'},
        {'station_id': 8, 'station_name': '顺义区监测站', 'district': '顺义区', 'latitude': 40.1291, 'longitude': 116.6546, 'station_type': 'standard'},
        {'station_id': 9, 'station_name': '昌平区监测站', 'district': '昌平区', 'latitude': 40.2205, 'longitude': 116.2313, 'station_type': 'standard'},
        {'station_id': 10, 'station_name': '大兴区监测站', 'district': '大兴区', 'latitude': 39.7289, 'longitude': 116.3381, 'station_type': 'traffic'},
    ]
    return pd.DataFrame(stations)

def generate_mock_air_quality(hours=720):
    end_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(hours=hours)
    
    stations_df = generate_mock_stations()
    station_ids = stations_df['station_id'].tolist()
    
    timestamps = pd.date_range(start=start_time, end=end_time, freq='h')
    
    all_data = []
    for station_id in station_ids:
        np.random.seed(station_id)
        base_pm25 = 35 + np.random.normal(0, 10)
        base_o3 = 80 + np.random.normal(0, 20)
        
        for ts in timestamps:
            hour = ts.hour
            weekday = ts.weekday()
            
            hour_factor_pm25 = 1.0 + 0.3 * np.sin((hour - 8) * np.pi / 12)
            weekday_factor = 1.0 + 0.15 if weekday < 5 else 0.85
            
            pm25 = max(5, base_pm25 * hour_factor_pm25 * weekday_factor + np.random.normal(0, 8))
            pm10 = pm25 * 1.6 + np.random.normal(0, 10)
            o3 = max(20, base_o3 * (1.0 + 0.4 * np.sin((hour - 12) * np.pi / 12)) + np.random.normal(0, 15))
            no2 = max(10, 25 + 15 * np.sin((hour - 9) * np.pi / 12) + np.random.normal(0, 8))
            so2 = max(2, 8 + np.random.normal(0, 3))
            co = max(0.2, 0.8 + 0.3 * np.sin((hour - 8) * np.pi / 12) + np.random.normal(0, 0.2))
            
            temperature = 15 + 10 * np.sin((ts.timetuple().tm_yday - 80) * 2 * np.pi / 365) + 5 * np.sin((hour - 6) * np.pi / 12)
            humidity = 50 + 20 * np.random.normal(0, 0.2)
            wind_direction = (180 + 90 * np.random.normal(0, 0.3)) % 360
            wind_speed = max(0.5, 2.5 + np.random.normal(0, 1.5))
            
            is_anomaly = False
            anomaly_reason = None
            if np.random.random() < 0.02:
                is_anomaly = True
                anomaly_reasons = ['设备维护', '数据异常', '极端天气', '校准中']
                anomaly_reason = np.random.choice(anomaly_reasons)
                pm25 = pm25 * 3 if np.random.random() > 0.5 else pm25 * 0.1
            
            all_data.append({
                'timestamp': ts,
                'station_id': station_id,
                'pm25': round(pm25, 2),
                'pm10': round(max(10, pm10), 2),
                'o3': round(o3, 2),
                'no2': round(no2, 2),
                'so2': round(so2, 2),
                'co': round(co, 2),
                'temperature': round(temperature, 2),
                'humidity': round(humidity, 2),
                'wind_direction': round(wind_direction, 2),
                'wind_speed': round(wind_speed, 2),
                'is_anomaly': is_anomaly,
                'anomaly_reason': anomaly_reason
            })
    
    return pd.DataFrame(all_data)

def generate_mock_traffic(days=30):
    end_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(days=days)
    
    stations_df = generate_mock_stations()
    traffic_stations = stations_df[stations_df['station_type'] == 'traffic']['station_id'].tolist()
    all_stations = stations_df['station_id'].tolist()
    
    timestamps = pd.date_range(start=start_time, end=end_time, freq='h')
    
    all_data = []
    for station_id in all_stations:
        np.random.seed(station_id + 100)
        base_traffic = 500 if station_id in traffic_stations else 200
        
        for ts in timestamps:
            hour = ts.hour
            weekday = ts.weekday()
            
            rush_hour_factor = 1.0
            if (7 <= hour <= 9) or (17 <= hour <= 19):
                rush_hour_factor = 2.5
            elif hour < 6 or hour > 22:
                rush_hour_factor = 0.3
            
            weekday_factor = 1.0 if weekday < 5 else 0.6
            
            vehicle_count = int(base_traffic * rush_hour_factor * weekday_factor * (0.9 + np.random.random() * 0.2))
            average_speed = max(10, 40 - 20 * rush_hour_factor + np.random.normal(0, 5))
            
            if average_speed < 20:
                congestion_level = '拥堵'
            elif average_speed < 35:
                congestion_level = '缓行'
            else:
                congestion_level = '畅通'
            
            all_data.append({
                'timestamp': ts,
                'station_id': station_id,
                'vehicle_count': vehicle_count,
                'average_speed': round(average_speed, 2),
                'congestion_level': congestion_level
            })
    
    return pd.DataFrame(all_data)

def generate_mock_construction_sites():
    sites = [
        {'site_id': 1, 'site_name': 'CBD核心区改造', 'district': '朝阳区', 'latitude': 39.9189, 'longitude': 116.4567, 'construction_type': 'commercial', 'start_date': '2024-01-15', 'end_date': '2025-06-30', 'is_active': True},
        {'site_id': 2, 'site_name': '中关村科技园扩建', 'district': '海淀区', 'latitude': 39.9789, 'longitude': 116.3123, 'construction_type': 'technology', 'start_date': '2024-03-01', 'end_date': '2025-12-31', 'is_active': True},
        {'site_id': 3, 'site_name': '丽泽商务区建设', 'district': '丰台区', 'latitude': 39.8623, 'longitude': 116.3156, 'construction_type': 'commercial', 'start_date': '2024-02-01', 'end_date': '2026-03-31', 'is_active': True},
        {'site_id': 4, 'site_name': '通州副中心建设', 'district': '通州区', 'latitude': 39.9045, 'longitude': 116.6623, 'construction_type': 'government', 'start_date': '2023-06-01', 'end_date': '2025-12-31', 'is_active': True},
        {'site_id': 5, 'site_name': '奥运村周边改造', 'district': '朝阳区', 'latitude': 39.9989, 'longitude': 116.3912, 'construction_type': 'residential', 'start_date': '2024-05-01', 'end_date': '2025-08-31', 'is_active': True},
        {'site_id': 6, 'site_name': '大兴新城建设', 'district': '大兴区', 'latitude': 39.7356, 'longitude': 116.3421, 'construction_type': 'residential', 'start_date': '2024-01-01', 'end_date': '2025-12-31', 'is_active': True},
    ]
    return pd.DataFrame(sites)

def generate_mock_complaints(days=60):
    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)
    
    districts = Config.DISTRICTS
    complaint_types = Config.COMPLAINT_TYPES
    
    stations_df = generate_mock_stations()
    station_lat_lookup = dict(zip(stations_df['district'], stations_df['latitude']))
    station_lon_lookup = dict(zip(stations_df['district'], stations_df['longitude']))
    
    np.random.seed(42)
    num_complaints = np.random.randint(80, 150)
    
    complaints = []
    for i in range(num_complaints):
        random_days = np.random.random() * days
        ts = start_time + timedelta(days=random_days)
        
        district = np.random.choice(districts)
        complaint_type = np.random.choice(complaint_types)
        
        descriptions = {
            '异味': '附近有明显的刺激性气味，疑似工业排放',
            '扬尘': '工地施工产生大量扬尘，未采取降尘措施',
            '噪音': '夜间施工噪音过大，影响居民休息',
            '烟雾': '有不明烟雾排放，空气质量明显下降',
            '其他': '其他环境问题需要调查'
        }
        
        base_lat = station_lat_lookup.get(district, 39.9)
        base_lon = station_lon_lookup.get(district, 116.4)
        
        is_verified = np.random.random() < 0.6
        
        complaints.append({
            'complaint_id': i + 1,
            'timestamp': ts,
            'district': district,
            'complaint_type': complaint_type,
            'description': descriptions[complaint_type],
            'latitude': base_lat + np.random.normal(0, 0.02),
            'longitude': base_lon + np.random.normal(0, 0.02),
            'is_verified': is_verified,
            'verified_at': ts + timedelta(hours=np.random.randint(1, 48)) if is_verified else None,
            'reporter_name': f'市民{i+1:03d}' if is_verified else None,
            'reporter_contact': f'138****{np.random.randint(1000, 9999)}' if is_verified else None
        })
    
    return pd.DataFrame(complaints).sort_values('timestamp', ascending=False)

def generate_mock_events():
    now = datetime.now()
    events = [
        {
            'event_id': 1,
            'event_type': '污染过程',
            'event_title': '春季沙尘天气影响',
            'event_description': '受蒙古气旋影响，本市出现大范围沙尘天气，PM10浓度显著升高',
            'start_time': now - timedelta(days=25),
            'end_time': now - timedelta(days=23),
            'district': None,
            'station_id': None,
            'related_pollutant': 'pm10',
            'created_by': 'system'
        },
        {
            'event_id': 2,
            'event_type': '交通管制',
            'event_title': '重大活动交通管制',
            'event_description': '朝阳区CBD区域实行临时交通管制，车流量减少约40%',
            'start_time': now - timedelta(days=15, hours=8),
            'end_time': now - timedelta(days=15, hours=20),
            'district': '朝阳区',
            'station_id': 1,
            'related_pollutant': 'no2',
            'created_by': 'admin'
        },
        {
            'event_id': 3,
            'event_type': '极端天气',
            'event_title': '高温臭氧污染',
            'event_description': '连续高温天气导致光化学反应加剧，臭氧浓度超标',
            'start_time': now - timedelta(days=10),
            'end_time': now - timedelta(days=8),
            'district': None,
            'station_id': None,
            'related_pollutant': 'o3',
            'created_by': 'system'
        },
        {
            'event_id': 4,
            'event_type': '设备维护',
            'event_title': '海淀区监测站设备校准',
            'event_description': '定期设备维护和校准，期间数据仅供参考',
            'start_time': now - timedelta(days=5, hours=2),
            'end_time': now - timedelta(days=5, hours=6),
            'district': '海淀区',
            'station_id': 2,
            'related_pollutant': None,
            'created_by': 'admin'
        },
        {
            'event_id': 5,
            'event_type': '污染过程',
            'event_title': '区域性逆温污染',
            'event_description': '近地逆温层导致污染物扩散条件差，PM2.5累积',
            'start_time': now - timedelta(days=3),
            'end_time': now - timedelta(days=1),
            'district': None,
            'station_id': None,
            'related_pollutant': 'pm25',
            'created_by': 'system'
        },
    ]
    return pd.DataFrame(events)

class MockDataStore:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_data()
        return cls._instance
    
    def _load_data(self):
        self.stations = generate_mock_stations()
        self.air_quality = generate_mock_air_quality()
        self.traffic = generate_mock_traffic()
        self.construction_sites = generate_mock_construction_sites()
        self.complaints = generate_mock_complaints()
        self.events = generate_mock_events()
        self.last_updated = datetime.now()
    
    def refresh(self):
        self._load_data()
