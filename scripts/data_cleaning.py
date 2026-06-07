#!/usr/bin/env python3
"""
空气质量数据清洗脚本
- 清洗监测点原始数据
- 补全缺失值标记
- 脱敏投诉数据
- 按口径聚合
"""

import json
import csv
from datetime import datetime, timedelta
from typing import Dict, List, Any
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class DataQualityConfig:
    """数据质量配置"""
    OFFLINE_THRESHOLD_MINUTES = 15
    PM25_MIN = 0
    PM25_MAX = 1000
    OZONE_MIN = 0
    OZONE_MAX = 500

POLLUTANT_STANDARDS = {
    'pm25': {'unit': 'μg/m³', 'good': 35, 'moderate': 75, 'unhealthy1': 115},
    'pm10': {'unit': 'μg/m³', 'good': 50, 'moderate': 150, 'unhealthy1': 250},
    'ozone': {'unit': 'μg/m³', 'good': 100, 'moderate': 160, 'unhealthy1': 215},
    'no2': {'unit': 'μg/m³', 'good': 40, 'moderate': 80, 'unhealthy1': 180},
}

def validate_reading(reading: Dict[str, Any]) -> bool:
    """验证单条读数的有效性"""
    try:
        pm25 = reading.get('pm25', -1)
        ozone = reading.get('ozone', -1)
        if not (DataQualityConfig.PM25_MIN <= pm25 <= DataQualityConfig.PM25_MAX):
            return False
        if not (DataQualityConfig.OZONE_MIN <= ozone <= DataQualityConfig.OZONE_MAX):
            return False
        return True
    except (TypeError, ValueError):
        return False

def mark_missing_values(readings: List[Dict[str, Any]], interval_minutes: int = 5) -> List[Dict[str, Any]]:
    """标记缺失值，避免将缺失值误读为0"""
    if not readings:
        return []
    
    readings = sorted(readings, key=lambda x: x['timestamp'])
    result = []
    expected_time = datetime.fromisoformat(readings[0]['timestamp'])
    
    for reading in readings:
        current_time = datetime.fromisoformat(reading['timestamp'])
        while expected_time < current_time:
            result.append({
                'timestamp': expected_time.isoformat(),
                'is_missing': True,
                'station_id': reading.get('station_id'),
            })
            expected_time += timedelta(minutes=interval_minutes)
        
        reading['is_missing'] = False
        result.append(reading)
        expected_time = current_time + timedelta(minutes=interval_minutes)
    
    return result

def aggregate_complaints(complaints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    投诉数据脱敏聚合 - 只保留统计计数，不包含任何个人信息
    
    重要：此步骤在数据入库前执行，确保原始投诉内容不进入公开数据库
    """
    aggregated = defaultdict(lambda: {
        'total_count': 0,
        'odor_count': 0,
        'dust_count': 0,
        'noise_count': 0,
        'other_count': 0,
    })
    
    for complaint in complaints:
        district = complaint.get('district', 'unknown')
        date = complaint.get('timestamp', '')[:10]
        key = f"{district}_{date}"
        
        aggregated[key]['total_count'] += 1
        complaint_type = complaint.get('type', 'other')
        if complaint_type == 'odor':
            aggregated[key]['odor_count'] += 1
        elif complaint_type == 'dust':
            aggregated[key]['dust_count'] += 1
        elif complaint_type == 'noise':
            aggregated[key]['noise_count'] += 1
        else:
            aggregated[key]['other_count'] += 1
    
    result = []
    for key, counts in aggregated.items():
        district, date = key.rsplit('_', 1)
        result.append({
            'district': district,
            'date': date,
            **counts,
        })
    
    return result

def check_station_status(stations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """检查监测点在线状态"""
    now = datetime.utcnow()
    for station in stations:
        last_update = datetime.fromisoformat(station['last_update'].replace('Z', '+00:00'))
        delta_minutes = (now - last_update).total_seconds() / 60
        
        if delta_minutes > DataQualityConfig.OFFLINE_THRESHOLD_MINUTES:
            station['status'] = 'offline'
        elif station.get('warning_flags', 0) > 0:
            station['status'] = 'warning'
        else:
            station['status'] = 'online'
    
    return stations

if __name__ == '__main__':
    print('空气质量数据清洗脚本已加载')
    print('包含功能：数据验证、缺失值标记、投诉脱敏聚合、监测点状态检查')
