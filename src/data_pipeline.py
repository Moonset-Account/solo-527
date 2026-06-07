import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from typing import Dict, List, Tuple, Optional
import warnings

warnings.filterwarnings('ignore')


DATA_SCHEMA = {
    'temperature_records': {
        'columns': {
            'record_id': 'str',
            'batch_id': 'str',
            'vehicle_id': 'str',
            'container_id': 'str',
            'customer_id': 'str',
            'route_id': 'str',
            'timestamp': 'datetime64[ns]',
            'temperature': 'float64',
            'probe_id': 'str',
            'probe_calibrated': 'bool',
            'probe_last_calibration': 'datetime64[ns]',
            'latitude': 'float64',
            'longitude': 'float64',
            'door_open': 'bool',
            'location_name': 'str',
            'data_quality': 'str'
        },
        'required': ['record_id', 'batch_id', 'vehicle_id', 'container_id', 'timestamp', 'temperature']
    },
    'door_events': {
        'columns': {
            'event_id': 'str',
            'batch_id': 'str',
            'vehicle_id': 'str',
            'container_id': 'str',
            'door_open_time': 'datetime64[ns]',
            'door_close_time': 'datetime64[ns]',
            'duration_minutes': 'float64',
            'location': 'str',
            'responsible_party': 'str',
            'reason': 'str'
        },
        'required': ['event_id', 'batch_id', 'door_open_time', 'door_close_time']
    },
    'shipment_info': {
        'columns': {
            'batch_id': 'str',
            'vehicle_id': 'str',
            'container_id': 'str',
            'customer_id': 'str',
            'customer_name': 'str',
            'route_id': 'str',
            'route_name': 'str',
            'departure_time': 'datetime64[ns]',
            'arrival_time': 'datetime64[ns]',
            'product_type': 'str',
            'target_temp_min': 'float64',
            'target_temp_max': 'float64',
            'status': 'str'
        },
        'required': ['batch_id', 'vehicle_id', 'departure_time', 'arrival_time']
    },
    'anomaly_records': {
        'columns': {
            'anomaly_id': 'str',
            'batch_id': 'str',
            'vehicle_id': 'str',
            'container_id': 'str',
            'anomaly_type': 'str',
            'start_time': 'datetime64[ns]',
            'end_time': 'datetime64[ns]',
            'duration_minutes': 'float64',
            'severity': 'str',
            'responsible_segment': 'str',
            'root_cause': 'str',
            'resolved': 'bool',
            'resolution_notes': 'str'
        },
        'required': ['anomaly_id', 'batch_id', 'anomaly_type', 'start_time']
    }
}

TEMP_THRESHOLDS = {
    'frozen': {'min': -25, 'max': -15, 'label': '冷冻 (-25°C ~ -15°C)'},
    'chilled': {'min': 2, 'max': 8, 'label': '冷藏 (2°C ~ 8°C)'},
    'controlled_room_temp': {'min': 15, 'max': 25, 'label': '温控室温 (15°C ~ 25°C)'}
}


VEHICLES = [f'VEH-{i:03d}' for i in range(1, 11)]
CONTAINERS = [f'CONT-{i:03d}' for i in range(1, 16)]
CUSTOMERS = [
    ('CUST-001', '鲜生达连锁超市'),
    ('CUST-002', '康泰医药'),
    ('CUST-003', '鲜冻食品批发'),
    ('CUST-004', '绿叶生鲜配送'),
    ('CUST-005', '美味餐饮供应链')
]
ROUTES = [
    ('R-001', '北京-天津-济南', 39.9042, 116.4074, 36.6512, 116.9832),
    ('R-002', '上海-南京-合肥', 31.2304, 121.4737, 31.8206, 117.2272),
    ('R-003', '广州-深圳-东莞', 23.1291, 113.2644, 23.0208, 113.7518),
    ('R-004', '成都-重庆-贵阳', 30.5728, 104.0668, 26.6470, 106.6302),
    ('R-005', '武汉-长沙-南昌', 30.5928, 114.3055, 28.6820, 115.8579)
]
PRODUCTS = ['冷冻肉类', '速冻果蔬', '生物试剂', '疫苗', '乳制品', '新鲜海鲜']
PROBE_IDS = [f'PROBE-{i:03d}' for i in range(1, 21)]
RESPONSIBLE_PARTIES = ['发货仓库', '运输司机', '中转仓', '收货方', '设备故障']
ANOMALY_TYPES = ['温度超标', '长时间开门', '设备故障', '延误送达', '探头异常']


def generate_mock_data(start_date: Optional[datetime] = None, 
                       num_batches: int = 50,
                       add_dirty_data: bool = True) -> Dict[str, pd.DataFrame]:
    if start_date is None:
        start_date = datetime.now() - timedelta(days=30)
    
    all_temp_records = []
    all_door_events = []
    all_shipment_info = []
    all_anomaly_records = []
    
    for batch_idx in range(num_batches):
        batch_id = f'BATCH-{2024000 + batch_idx:07d}'
        vehicle_id = random.choice(VEHICLES)
        container_id = random.choice(CONTAINERS)
        customer_id, customer_name = random.choice(CUSTOMERS)
        route_info = random.choice(ROUTES)
        route_id, route_name, lat1, lon1, lat2, lon2 = route_info
        product_type = random.choice(PRODUCTS)
        
        if product_type in ['冷冻肉类', '速冻果蔬', '新鲜海鲜']:
            temp_range = TEMP_THRESHOLDS['frozen']
        elif product_type in ['生物试剂', '疫苗']:
            temp_range = TEMP_THRESHOLDS['chilled']
        else:
            temp_range = TEMP_THRESHOLDS['controlled_room_temp']
        
        departure_time = start_date + timedelta(
            days=random.randint(0, 25),
            hours=random.randint(6, 10),
            minutes=random.randint(0, 59)
        )
        transit_hours = random.randint(8, 36)
        arrival_time = departure_time + timedelta(hours=transit_hours, minutes=random.randint(0, 59))
        
        shipment_status = random.choices(
            ['已完成', '运输中', '异常', '已签收'],
            weights=[0.7, 0.1, 0.15, 0.05]
        )[0]
        
        all_shipment_info.append({
            'batch_id': batch_id,
            'vehicle_id': vehicle_id,
            'container_id': container_id,
            'customer_id': customer_id,
            'customer_name': customer_name,
            'route_id': route_id,
            'route_name': route_name,
            'departure_time': departure_time,
            'arrival_time': arrival_time,
            'product_type': product_type,
            'target_temp_min': temp_range['min'],
            'target_temp_max': temp_range['max'],
            'status': shipment_status
        })
        
        probe_id = random.choice(PROBE_IDS)
        probe_calibrated = random.choice([True, True, True, True, False])
        last_calibration = departure_time - timedelta(days=random.randint(1, 180))
        
        num_points = int((transit_hours * 60) / 5) + 1
        temp_records = _generate_temperature_records(
            batch_id=batch_id,
            vehicle_id=vehicle_id,
            container_id=container_id,
            customer_id=customer_id,
            route_id=route_id,
            departure_time=departure_time,
            arrival_time=arrival_time,
            num_points=num_points,
            temp_range=temp_range,
            probe_id=probe_id,
            probe_calibrated=probe_calibrated,
            last_calibration=last_calibration,
            lat1=lat1, lon1=lon1, lat2=lat2, lon2=lon2,
            add_dirty_data=add_dirty_data
        )
        all_temp_records.extend(temp_records)
        
        door_events = _generate_door_events(
            batch_id=batch_id,
            vehicle_id=vehicle_id,
            container_id=container_id,
            departure_time=departure_time,
            arrival_time=arrival_time,
            route_name=route_name
        )
        all_door_events.extend(door_events)
        
        anomalies = _generate_anomalies(
            batch_id=batch_id,
            vehicle_id=vehicle_id,
            container_id=container_id,
            temp_records=temp_records,
            door_events=door_events,
            temp_range=temp_range,
            probe_calibrated=probe_calibrated
        )
        all_anomaly_records.extend(anomalies)
    
    temp_df = pd.DataFrame(all_temp_records)
    door_df = pd.DataFrame(all_door_events)
    shipment_df = pd.DataFrame(all_shipment_info)
    anomaly_df = pd.DataFrame(all_anomaly_records)
    
    for col in ['timestamp', 'probe_last_calibration']:
        if col in temp_df.columns:
            temp_df[col] = pd.to_datetime(temp_df[col])
    
    for col in ['door_open_time', 'door_close_time']:
        if col in door_df.columns:
            door_df[col] = pd.to_datetime(door_df[col])
    
    for col in ['departure_time', 'arrival_time']:
        if col in shipment_df.columns:
            shipment_df[col] = pd.to_datetime(shipment_df[col])
    
    for col in ['start_time', 'end_time']:
        if col in anomaly_df.columns:
            anomaly_df[col] = pd.to_datetime(anomaly_df[col])
    
    return {
        'temperature_records': temp_df,
        'door_events': door_df,
        'shipment_info': shipment_df,
        'anomaly_records': anomaly_df
    }


def _generate_temperature_records(batch_id, vehicle_id, container_id, customer_id,
                                  route_id, departure_time, arrival_time, num_points,
                                  temp_range, probe_id, probe_calibrated, last_calibration,
                                  lat1, lon1, lat2, lon2, add_dirty_data):
    records = []
    temp_center = (temp_range['min'] + temp_range['max']) / 2
    temp_std = 1.5
    
    has_anomaly = random.random() < 0.35
    anomaly_start_idx = random.randint(int(num_points * 0.2), int(num_points * 0.7)) if has_anomaly else -1
    anomaly_duration = random.randint(10, 60) if has_anomaly else 0
    
    for i in range(num_points):
        timestamp = departure_time + timedelta(minutes=i * 5)
        progress = i / max(num_points - 1, 1)
        
        lat = lat1 + (lat2 - lat1) * progress + random.uniform(-0.05, 0.05)
        lon = lon1 + (lon2 - lon1) * progress + random.uniform(-0.05, 0.05)
        
        if has_anomaly and anomaly_start_idx <= i < anomaly_start_idx + anomaly_duration:
            temp_shift = random.uniform(5, 12)
            if random.random() < 0.5:
                temp = temp_center + temp_shift
            else:
                temp = temp_center - temp_shift
            door_open = random.random() < 0.7
        else:
            temp = np.random.normal(temp_center, temp_std)
            temp = max(temp_range['min'] - 2, min(temp_range['max'] + 2, temp))
            door_open = random.random() < 0.05
        
        data_quality = 'good'
        
        if add_dirty_data and random.random() < 0.03:
            corrupt_type = random.randint(1, 4)
            if corrupt_type == 1:
                temp = np.nan
                data_quality = 'missing_value'
            elif corrupt_type == 2:
                temp = 999
                data_quality = 'outlier'
            elif corrupt_type == 3:
                lat = None
                data_quality = 'missing_gps'
            else:
                temp = temp_center
                data_quality = 'stuck_value'
        
        record = {
            'record_id': f'{batch_id}-{i:05d}',
            'batch_id': batch_id,
            'vehicle_id': vehicle_id,
            'container_id': container_id,
            'customer_id': customer_id,
            'route_id': route_id,
            'timestamp': timestamp,
            'temperature': temp,
            'probe_id': probe_id,
            'probe_calibrated': probe_calibrated,
            'probe_last_calibration': last_calibration,
            'latitude': lat,
            'longitude': lon,
            'door_open': door_open,
            'location_name': f'路段{i}',
            'data_quality': data_quality
        }
        records.append(record)
    
    return records


def _generate_door_events(batch_id, vehicle_id, container_id, departure_time, arrival_time, route_name):
    events = []
    num_events = random.randint(0, 5)
    locations = route_name.split('-')
    
    for i in range(num_events):
        event_id = f'DOOR-{batch_id}-{i:03d}'
        event_time = departure_time + timedelta(
            minutes=random.randint(30, int((arrival_time - departure_time).total_seconds() / 60) - 30)
        )
        duration = random.randint(2, 45)
        close_time = event_time + timedelta(minutes=duration)
        responsible = random.choice(RESPONSIBLE_PARTIES)
        location = random.choice(locations) if locations else '途中'
        
        reasons = ['装卸货', '检查货物', '设备检修', '异常处理', '其他']
        reason = random.choice(reasons)
        
        events.append({
            'event_id': event_id,
            'batch_id': batch_id,
            'vehicle_id': vehicle_id,
            'container_id': container_id,
            'door_open_time': event_time,
            'door_close_time': close_time,
            'duration_minutes': duration,
            'location': location,
            'responsible_party': responsible,
            'reason': reason
        })
    
    return events


def _generate_anomalies(batch_id, vehicle_id, container_id, temp_records, door_events, temp_range, probe_calibrated):
    anomalies = []
    
    temp_df = pd.DataFrame(temp_records)
    if 'temperature' in temp_df.columns:
        above_max = temp_df[temp_df['temperature'] > temp_range['max'] + 1]
        below_min = temp_df[temp_df['temperature'] < temp_range['min'] - 1]
        
        for name, subset in [('高温异常', above_max), ('低温异常', below_min)]:
            if len(subset) > 5:
                times = subset['timestamp'].tolist()
                for j in range(0, len(times), 20):
                    chunk = times[j:j+20]
                    if len(chunk) >= 3:
                        anomaly_id = f'ANOM-{batch_id}-{len(anomalies):03d}'
                        severity = '高' if len(chunk) > 10 else '中'
                        segments = ['运输途中', '发货段', '中转段', '收货段']
                        segment = random.choice(segments)
                        causes = ['制冷设备故障', '长时间开门', '环境温度过高', '装卸货延误', '探头偏差']
                        
                        if not probe_calibrated:
                            causes.append('探头未校准')
                        
                        anomalies.append({
                            'anomaly_id': anomaly_id,
                            'batch_id': batch_id,
                            'vehicle_id': vehicle_id,
                            'container_id': container_id,
                            'anomaly_type': name,
                            'start_time': chunk[0],
                            'end_time': chunk[-1],
                            'duration_minutes': (chunk[-1] - chunk[0]).total_seconds() / 60,
                            'severity': severity,
                            'responsible_segment': segment,
                            'root_cause': random.choice(causes),
                            'resolved': random.random() < 0.6,
                            'resolution_notes': '' if random.random() < 0.4 else '已现场核实处理'
                        })
    
    for door_event in door_events:
        if door_event['duration_minutes'] > 15:
            anomaly_id = f'ANOM-{batch_id}-{len(anomalies):03d}'
            anomalies.append({
                'anomaly_id': anomaly_id,
                'batch_id': batch_id,
                'vehicle_id': vehicle_id,
                'container_id': container_id,
                'anomaly_type': '长时间开门',
                'start_time': door_event['door_open_time'],
                'end_time': door_event['door_close_time'],
                'duration_minutes': door_event['duration_minutes'],
                'severity': '中' if door_event['duration_minutes'] < 30 else '高',
                'responsible_segment': door_event['responsible_party'],
                'root_cause': door_event['reason'],
                'resolved': random.random() < 0.5,
                'resolution_notes': ''
            })
    
    if not probe_calibrated:
        anomaly_id = f'ANOM-{batch_id}-{len(anomalies):03d}'
        anomalies.append({
            'anomaly_id': anomaly_id,
            'batch_id': batch_id,
            'vehicle_id': vehicle_id,
            'container_id': container_id,
            'anomaly_type': '探头未校准',
            'start_time': temp_records[0]['timestamp'],
            'end_time': temp_records[-1]['timestamp'],
            'duration_minutes': (temp_records[-1]['timestamp'] - temp_records[0]['timestamp']).total_seconds() / 60,
            'severity': '高',
            'responsible_segment': '质量管理',
            'root_cause': '温度探头超过校准有效期',
            'resolved': False,
            'resolution_notes': '请立即安排校准，数据可能存在偏差'
        })
    
    return anomalies


def clean_temperature_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    cleaned = df.copy()
    dirty_records = pd.DataFrame()
    dirty_mask = None
    
    if 'temperature' in cleaned.columns:
        missing_mask = cleaned['temperature'].isna()
        extreme_mask = (cleaned['temperature'] > 100) | (cleaned['temperature'] < -50)
        
        dirty_mask = missing_mask | extreme_mask
        dirty_records = cleaned[dirty_mask].copy()
        
        cleaned.loc[extreme_mask, 'temperature'] = np.nan
        
        if 'timestamp' in cleaned.columns:
            temp_series = pd.Series(
                cleaned['temperature'].values,
                index=pd.to_datetime(cleaned['timestamp'])
            )
            temp_series = temp_series.sort_index()
            temp_series = temp_series[~temp_series.index.duplicated(keep='first')]
            temp_interpolated = temp_series.interpolate(method='time')
            
            for i in range(len(cleaned)):
                if pd.isna(cleaned['temperature'].iloc[i]):
                    ts = pd.to_datetime(cleaned['timestamp'].iloc[i])
                    if ts in temp_interpolated.index:
                        cleaned.loc[cleaned.index[i], 'temperature'] = temp_interpolated.loc[ts]
        
        if cleaned['temperature'].isna().any():
            cleaned['temperature'] = cleaned['temperature'].interpolate(method='linear')
            cleaned['temperature'] = cleaned['temperature'].fillna(cleaned['temperature'].mean())
    
    if 'latitude' in cleaned.columns and 'longitude' in cleaned.columns:
        cleaned['latitude'] = cleaned['latitude'].ffill().bfill()
        cleaned['longitude'] = cleaned['longitude'].ffill().bfill()
    
    if 'data_quality' not in cleaned.columns:
        cleaned['data_quality'] = 'good'
    
    if dirty_mask is not None:
        cleaned.loc[dirty_mask, 'data_quality'] = 'imputed'
    
    return cleaned, dirty_records


def validate_data_schema(df: pd.DataFrame, schema_name: str) -> Tuple[bool, List[str]]:
    if schema_name not in DATA_SCHEMA:
        return False, [f'未知的数据表: {schema_name}']
    
    schema = DATA_SCHEMA[schema_name]
    errors = []
    
    for col in schema['required']:
        if col not in df.columns:
            errors.append(f'缺少必填字段: {col}')
    
    for col, dtype in schema['columns'].items():
        if col in df.columns:
            try:
                if 'datetime' in dtype:
                    pd.to_datetime(df[col], errors='raise')
                elif 'float' in dtype:
                    pd.to_numeric(df[col], errors='raise')
            except Exception:
                errors.append(f'字段 {col} 数据类型不匹配，期望 {dtype}')
    
    return len(errors) == 0, errors


def aggregate_by_batch(temp_df: pd.DataFrame, shipment_df: pd.DataFrame) -> pd.DataFrame:
    if temp_df.empty or shipment_df.empty:
        return pd.DataFrame()
    
    temp_agg = temp_df.groupby('batch_id').agg({
        'temperature': ['mean', 'min', 'max', 'std', 'count'],
        'door_open': 'sum',
        'timestamp': ['min', 'max'],
        'probe_calibrated': 'first'
    }).reset_index()
    
    temp_agg.columns = ['batch_id', 'avg_temp', 'min_temp', 'max_temp', 'temp_std', 
                        'record_count', 'door_open_count', 'first_record', 'last_record',
                        'probe_calibrated']
    
    merged = pd.merge(shipment_df, temp_agg, on='batch_id', how='left')
    
    if 'target_temp_min' in merged.columns and 'target_temp_max' in merged.columns:
        def calc_exceeds(row):
            batch_data = temp_df[temp_df['batch_id'] == row['batch_id']]
            if batch_data.empty:
                return 0
            exceed = batch_data[
                (batch_data['temperature'] > row['target_temp_max'] + 0.5) |
                (batch_data['temperature'] < row['target_temp_min'] - 0.5)
            ]
            return len(exceed)
        
        merged['temp_exceed_count'] = merged.apply(calc_exceeds, axis=1)
        merged['exceed_rate'] = merged['temp_exceed_count'] / merged['record_count'].fillna(1)
    
    return merged


def apply_filters(data: Dict[str, pd.DataFrame],
                  vehicles: Optional[List[str]] = None,
                  routes: Optional[List[str]] = None,
                  batches: Optional[List[str]] = None,
                  containers: Optional[List[str]] = None,
                  customers: Optional[List[str]] = None,
                  date_range: Optional[Tuple[datetime, datetime]] = None) -> Dict[str, pd.DataFrame]:
    
    result = {k: v.copy() for k, v in data.items()}
    
    shipment_df = result['shipment_info']
    
    filter_mask = pd.Series(True, index=shipment_df.index)
    
    if vehicles:
        filter_mask &= shipment_df['vehicle_id'].isin(vehicles)
    if routes:
        filter_mask &= shipment_df['route_id'].isin(routes)
    if batches:
        filter_mask &= shipment_df['batch_id'].isin(batches)
    if containers:
        filter_mask &= shipment_df['container_id'].isin(containers)
    if customers:
        filter_mask &= shipment_df['customer_id'].isin(customers)
    
    filtered_shipment = shipment_df[filter_mask]
    filtered_batch_ids = filtered_shipment['batch_id'].unique()
    
    if date_range:
        start_date, end_date = date_range
        
        shipment_time_mask = pd.Series(True, index=filtered_shipment.index)
        if 'departure_time' in filtered_shipment.columns and 'arrival_time' in filtered_shipment.columns:
            shipment_time_mask = (
                (filtered_shipment['departure_time'] <= end_date) & 
                (filtered_shipment['arrival_time'] >= start_date)
            )
        filtered_shipment = filtered_shipment[shipment_time_mask]
        filtered_batch_ids = filtered_shipment['batch_id'].unique()
        
        if 'temperature_records' in result:
            temp_df = result['temperature_records']
            if 'timestamp' in temp_df.columns:
                temp_mask = (temp_df['timestamp'] >= start_date) & (temp_df['timestamp'] <= end_date)
                result['temperature_records'] = temp_df[temp_mask & temp_df['batch_id'].isin(filtered_batch_ids)]
        
        if 'door_events' in result:
            door_df = result['door_events']
            if 'door_open_time' in door_df.columns and 'door_close_time' in door_df.columns:
                door_mask = (
                    (door_df['door_open_time'] <= end_date) & 
                    (door_df['door_close_time'] >= start_date)
                )
                result['door_events'] = door_df[door_mask & door_df['batch_id'].isin(filtered_batch_ids)]
            elif 'door_open_time' in door_df.columns:
                door_mask = (door_df['door_open_time'] >= start_date) & (door_df['door_open_time'] <= end_date)
                result['door_events'] = door_df[door_mask & door_df['batch_id'].isin(filtered_batch_ids)]
        
        if 'anomaly_records' in result:
            anomaly_df = result['anomaly_records']
            if 'start_time' in anomaly_df.columns and 'end_time' in anomaly_df.columns:
                anomaly_mask = (
                    (anomaly_df['start_time'] <= end_date) & 
                    (anomaly_df['end_time'] >= start_date)
                )
                result['anomaly_records'] = anomaly_df[anomaly_mask & anomaly_df['batch_id'].isin(filtered_batch_ids)]
            elif 'start_time' in anomaly_df.columns:
                anomaly_mask = (anomaly_df['start_time'] >= start_date) & (anomaly_df['start_time'] <= end_date)
                result['anomaly_records'] = anomaly_df[anomaly_mask & anomaly_df['batch_id'].isin(filtered_batch_ids)]
    else:
        if 'temperature_records' in result:
            result['temperature_records'] = result['temperature_records'][
                result['temperature_records']['batch_id'].isin(filtered_batch_ids)
            ]
        if 'door_events' in result:
            result['door_events'] = result['door_events'][
                result['door_events']['batch_id'].isin(filtered_batch_ids)
            ]
        if 'anomaly_records' in result:
            result['anomaly_records'] = result['anomaly_records'][
                result['anomaly_records']['batch_id'].isin(filtered_batch_ids)
            ]
    
    result['shipment_info'] = filtered_shipment
    
    return result


def get_filter_summary(filters: Dict, data: Dict[str, pd.DataFrame]) -> Dict:
    summary = {}
    temp_df = data.get('temperature_records', pd.DataFrame())
    shipment_df = data.get('shipment_info', pd.DataFrame())
    anomaly_df = data.get('anomaly_records', pd.DataFrame())
    
    summary['applied_filters'] = filters
    summary['total_batches'] = len(shipment_df)
    summary['total_records'] = len(temp_df)
    summary['total_anomalies'] = len(anomaly_df)
    summary['date_range'] = None
    
    if not temp_df.empty and 'timestamp' in temp_df.columns:
        summary['date_range'] = {
            'start': temp_df['timestamp'].min(),
            'end': temp_df['timestamp'].max()
        }
    
    if not shipment_df.empty:
        summary['vehicles_count'] = shipment_df['vehicle_id'].nunique()
        summary['routes_count'] = shipment_df['route_id'].nunique()
        summary['customers_count'] = shipment_df['customer_id'].nunique()
        summary['containers_count'] = shipment_df['container_id'].nunique()
    
    uncalibrated = shipment_df[shipment_df['batch_id'].isin(
        temp_df[~temp_df['probe_calibrated']]['batch_id'].unique()
    )] if not temp_df.empty else pd.DataFrame()
    summary['uncalibrated_probe_batches'] = len(uncalibrated)
    
    return summary
