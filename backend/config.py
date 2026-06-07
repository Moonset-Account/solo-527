import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'air_quality')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
    
    USE_MOCK_DATA = os.getenv('USE_MOCK_DATA', 'true').lower() == 'true'
    
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    POLLUTANTS = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co']
    POLLUTANT_NAMES = {
        'pm25': 'PM2.5 (μg/m³)',
        'pm10': 'PM10 (μg/m³)',
        'o3': '臭氧 O₃ (μg/m³)',
        'no2': '二氧化氮 NO₂ (μg/m³)',
        'so2': '二氧化硫 SO₂ (μg/m³)',
        'co': '一氧化碳 CO (mg/m³)'
    }
    
    DISTRICTS = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', 
                 '石景山区', '通州区', '顺义区', '昌平区', '大兴区']
    
    COMPLAINT_TYPES = ['异味', '扬尘', '噪音', '烟雾', '其他']
    
    AQI_LEVELS = [
        {'min': 0, 'max': 50, 'level': '优', 'color': '#00e400'},
        {'min': 51, 'max': 100, 'level': '良', 'color': '#ffff00'},
        {'min': 101, 'max': 150, 'level': '轻度污染', 'color': '#ff7e00'},
        {'min': 151, 'max': 200, 'level': '中度污染', 'color': '#ff0000'},
        {'min': 201, 'max': 300, 'level': '重度污染', 'color': '#99004c'},
        {'min': 301, 'max': 500, 'level': '严重污染', 'color': '#7e0023'}
    ]
