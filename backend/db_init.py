import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from backend.config import Config
from backend.mock_data import (
    generate_mock_stations,
    generate_mock_air_quality,
    generate_mock_traffic,
    generate_mock_construction_sites,
    generate_mock_complaints,
    generate_mock_events
)

def get_default_db_engine():
    """连接到默认的postgres数据库，用于创建air_quality数据库"""
    url = f"postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/postgres"
    return create_engine(url, isolation_level='AUTOCOMMIT')

def get_air_quality_engine():
    """连接到air_quality数据库"""
    return create_engine(Config.DATABASE_URL)

def check_postgres_available():
    """检查PostgreSQL服务是否可用"""
    try:
        engine = get_default_db_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"PostgreSQL 连接失败: {e}")
        return False

def database_exists():
    """检查air_quality数据库是否存在"""
    try:
        engine = get_default_db_engine()
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT 1 FROM pg_database WHERE datname = 'air_quality'"
            ))
            return result.fetchone() is not None
    except Exception as e:
        print(f"检查数据库失败: {e}")
        return False

def create_database():
    """创建air_quality数据库"""
    print("创建 air_quality 数据库...")
    engine = get_default_db_engine()
    with engine.connect() as conn:
        conn.execute(text("CREATE DATABASE air_quality"))
    print("✅ 数据库创建成功")

def create_extensions():
    """创建TimescaleDB扩展"""
    print("创建 TimescaleDB 扩展...")
    engine = get_air_quality_engine()
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
        conn.commit()
    print("✅ TimescaleDB 扩展创建成功")

def create_tables():
    """创建所有表（使用Python执行，避免SQL解析问题）"""
    print("创建数据库表...")
    engine = get_air_quality_engine()
    
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS monitoring_stations (
                station_id SERIAL PRIMARY KEY,
                station_name VARCHAR(100) NOT NULL,
                district VARCHAR(50) NOT NULL,
                latitude DECIMAL(9, 6) NOT NULL,
                longitude DECIMAL(9, 6) NOT NULL,
                station_type VARCHAR(50) DEFAULT 'standard',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS air_quality_raw (
                record_id BIGSERIAL,
                timestamp TIMESTAMPTZ NOT NULL,
                station_id INTEGER NOT NULL REFERENCES monitoring_stations(station_id),
                pm25 DECIMAL(8, 2),
                pm10 DECIMAL(8, 2),
                o3 DECIMAL(8, 2),
                no2 DECIMAL(8, 2),
                so2 DECIMAL(8, 2),
                co DECIMAL(8, 2),
                temperature DECIMAL(5, 2),
                humidity DECIMAL(5, 2),
                wind_direction DECIMAL(5, 2),
                wind_speed DECIMAL(5, 2),
                is_anomaly BOOLEAN DEFAULT false,
                anomaly_reason VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (record_id, timestamp)
            )
        """))
        conn.commit()
        
        try:
            conn.execute(text("""
                SELECT create_hypertable('air_quality_raw', 'timestamp',
                    chunk_time_interval => INTERVAL '1 day',
                    if_not_exists => TRUE
                )
            """))
            conn.commit()
        except Exception as e:
            print(f"  (超表已存在或跳过: {str(e)[:40]})")
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_air_quality_station_time 
            ON air_quality_raw(station_id, timestamp DESC)
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS air_quality_hourly (
                hour_bucket TIMESTAMPTZ NOT NULL,
                station_id INTEGER NOT NULL REFERENCES monitoring_stations(station_id),
                pm25_avg DECIMAL(8, 2),
                pm25_median DECIMAL(8, 2),
                pm25_max DECIMAL(8, 2),
                pm25_min DECIMAL(8, 2),
                pm25_count INTEGER,
                o3_avg DECIMAL(8, 2),
                o3_median DECIMAL(8, 2),
                o3_max DECIMAL(8, 2),
                o3_min DECIMAL(8, 2),
                o3_count INTEGER,
                pm10_avg DECIMAL(8, 2),
                no2_avg DECIMAL(8, 2),
                so2_avg DECIMAL(8, 2),
                co_avg DECIMAL(8, 2),
                temperature_avg DECIMAL(5, 2),
                humidity_avg DECIMAL(5, 2),
                wind_direction_avg DECIMAL(5, 2),
                wind_speed_avg DECIMAL(5, 2),
                record_count INTEGER,
                anomaly_count INTEGER,
                PRIMARY KEY (hour_bucket, station_id)
            )
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS air_quality_daily (
                day_bucket TIMESTAMPTZ NOT NULL,
                station_id INTEGER NOT NULL REFERENCES monitoring_stations(station_id),
                pm25_avg DECIMAL(8, 2),
                pm25_median DECIMAL(8, 2),
                pm25_max DECIMAL(8, 2),
                pm25_min DECIMAL(8, 2),
                pm25_count INTEGER,
                o3_avg DECIMAL(8, 2),
                o3_median DECIMAL(8, 2),
                o3_max DECIMAL(8, 2),
                o3_min DECIMAL(8, 2),
                o3_count INTEGER,
                pm10_avg DECIMAL(8, 2),
                no2_avg DECIMAL(8, 2),
                so2_avg DECIMAL(8, 2),
                co_avg DECIMAL(8, 2),
                record_count INTEGER,
                anomaly_count INTEGER,
                PRIMARY KEY (day_bucket, station_id)
            )
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS traffic_flow (
                record_id BIGSERIAL,
                timestamp TIMESTAMPTZ NOT NULL,
                station_id INTEGER NOT NULL REFERENCES monitoring_stations(station_id),
                vehicle_count INTEGER,
                average_speed DECIMAL(5, 2),
                congestion_level VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (record_id, timestamp)
            )
        """))
        conn.commit()
        
        try:
            conn.execute(text("""
                SELECT create_hypertable('traffic_flow', 'timestamp',
                    chunk_time_interval => INTERVAL '1 day',
                    if_not_exists => TRUE
                )
            """))
            conn.commit()
        except Exception as e:
            pass
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS construction_sites (
                site_id SERIAL PRIMARY KEY,
                site_name VARCHAR(100) NOT NULL,
                district VARCHAR(50) NOT NULL,
                latitude DECIMAL(9, 6) NOT NULL,
                longitude DECIMAL(9, 6) NOT NULL,
                construction_type VARCHAR(50),
                start_date DATE,
                end_date DATE,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS complaint_records (
                complaint_id SERIAL PRIMARY KEY,
                timestamp TIMESTAMPTZ NOT NULL,
                district VARCHAR(50) NOT NULL,
                complaint_type VARCHAR(50) NOT NULL,
                description TEXT,
                latitude DECIMAL(9, 6),
                longitude DECIMAL(9, 6),
                is_verified BOOLEAN DEFAULT false,
                verified_at TIMESTAMPTZ,
                reporter_name VARCHAR(100),
                reporter_contact VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_complaints_time_district 
            ON complaint_records(timestamp DESC, district)
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS event_annotations (
                event_id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                event_title VARCHAR(200) NOT NULL,
                event_description TEXT,
                start_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ,
                district VARCHAR(50),
                station_id INTEGER REFERENCES monitoring_stations(station_id),
                related_pollutant VARCHAR(20),
                created_by VARCHAR(50) DEFAULT 'system',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS data_update_log (
                log_id SERIAL PRIMARY KEY,
                data_type VARCHAR(50) NOT NULL,
                last_updated TIMESTAMPTZ NOT NULL,
                record_count INTEGER DEFAULT 0,
                source VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
    
    print("✅ 所有表创建完成")

def compute_and_insert_aggregates(engine, air_quality_df):
    """计算并插入小时级和日级聚合数据"""
    print("计算聚合数据...")
    
    hourly = air_quality_df.copy()
    hourly['hour_bucket'] = hourly['timestamp'].dt.floor('h')
    
    pollutants = Config.POLLUTANTS
    agg_dict = {}
    for p in pollutants:
        if p in hourly.columns:
            agg_dict[f'{p}_avg'] = (p, 'mean')
            agg_dict[f'{p}_median'] = (p, 'median')
            agg_dict[f'{p}_max'] = (p, 'max')
            agg_dict[f'{p}_min'] = (p, 'min')
            agg_dict[f'{p}_count'] = (p, 'count')
    
    agg_dict['temperature_avg'] = ('temperature', 'mean')
    agg_dict['humidity_avg'] = ('humidity', 'mean')
    agg_dict['wind_direction_avg'] = ('wind_direction', 'mean')
    agg_dict['wind_speed_avg'] = ('wind_speed', 'mean')
    agg_dict['record_count'] = ('timestamp', 'count')
    agg_dict['anomaly_count'] = ('is_anomaly', 'sum')
    
    hourly_agg = hourly.groupby(['hour_bucket', 'station_id']).agg(**agg_dict).reset_index()
    
    for col in hourly_agg.columns:
        if col not in ['hour_bucket', 'station_id']:
            hourly_agg[col] = hourly_agg[col].round(4)
    
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE air_quality_hourly"))
        conn.commit()
    
    hourly_agg.to_sql('air_quality_hourly', engine, if_exists='append', index=False)
    print(f"  ✅ 插入 {len(hourly_agg)} 条小时级聚合数据")
    
    daily = air_quality_df.copy()
    daily['day_bucket'] = daily['timestamp'].dt.floor('d')
    
    daily_agg_dict = {}
    for p in pollutants:
        if p in daily.columns:
            daily_agg_dict[f'{p}_avg'] = (p, 'mean')
            daily_agg_dict[f'{p}_median'] = (p, 'median')
            daily_agg_dict[f'{p}_max'] = (p, 'max')
            daily_agg_dict[f'{p}_min'] = (p, 'min')
            daily_agg_dict[f'{p}_count'] = (p, 'count')
    
    daily_agg_dict['record_count'] = ('timestamp', 'count')
    daily_agg_dict['anomaly_count'] = ('is_anomaly', 'sum')
    
    daily_agg = daily.groupby(['day_bucket', 'station_id']).agg(**daily_agg_dict).reset_index()
    
    for col in daily_agg.columns:
        if col not in ['day_bucket', 'station_id']:
            daily_agg[col] = daily_agg[col].round(4)
    
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE air_quality_daily"))
        conn.commit()
    
    daily_agg.to_sql('air_quality_daily', engine, if_exists='append', index=False)
    print(f"  ✅ 插入 {len(daily_agg)} 条日级聚合数据")

def insert_stations(engine):
    """插入监测站数据"""
    print("插入监测站数据...")
    stations = generate_mock_stations()
    stations.to_sql('monitoring_stations', engine, if_exists='append', index=False)
    print(f"✅ 插入 {len(stations)} 个监测站")
    return stations

def insert_air_quality_data(engine):
    """插入空气质量原始数据"""
    print("插入空气质量原始数据...")
    air_quality = generate_mock_air_quality(hours=720)
    
    batch_size = 5000
    total = len(air_quality)
    for i in range(0, total, batch_size):
        batch = air_quality.iloc[i:i+batch_size]
        batch.to_sql('air_quality_raw', engine, if_exists='append', index=False)
    
    print(f"✅ 插入 {total} 条空气质量原始数据")
    return air_quality

def insert_traffic_data(engine):
    """插入交通流量数据"""
    print("插入交通流量数据...")
    traffic = generate_mock_traffic(days=30)
    traffic.to_sql('traffic_flow', engine, if_exists='append', index=False)
    print(f"✅ 插入 {len(traffic)} 条交通流量数据")

def insert_construction_sites(engine):
    """插入施工工地数据"""
    print("插入施工工地数据...")
    sites = generate_mock_construction_sites()
    sites.to_sql('construction_sites', engine, if_exists='append', index=False)
    print(f"✅ 插入 {len(sites)} 个施工工地")

def insert_complaints(engine):
    """插入投诉记录数据"""
    print("插入投诉记录数据...")
    complaints = generate_mock_complaints(days=60)
    complaints.to_sql('complaint_records', engine, if_exists='append', index=False)
    print(f"✅ 插入 {len(complaints)} 条投诉记录")

def insert_events(engine):
    """插入事件注释数据"""
    print("插入事件注释数据...")
    events = generate_mock_events()
    events.to_sql('event_annotations', engine, if_exists='append', index=False)
    print(f"✅ 插入 {len(events)} 条事件注释")

def insert_data_update_log(engine, air_quality_count, traffic_count, complaints_count):
    """插入数据更新日志"""
    print("更新数据更新日志...")
    now = datetime.now()
    
    log_entries = [
        {'data_type': 'air_quality', 'last_updated': now, 'record_count': air_quality_count, 'source': 'city_monitoring_network'},
        {'data_type': 'traffic', 'last_updated': now, 'record_count': traffic_count, 'source': 'traffic_management_bureau'},
        {'data_type': 'complaints', 'last_updated': now, 'record_count': complaints_count, 'source': 'public_reporting_system'},
    ]
    
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE data_update_log"))
        conn.commit()
    
    log_df = pd.DataFrame(log_entries)
    log_df.to_sql('data_update_log', engine, if_exists='append', index=False)
    print("✅ 数据更新日志已更新")

def init_database(force=False):
    """完整初始化数据库"""
    print("=" * 60)
    print("初始化 TimescaleDB 数据库")
    print("=" * 60)
    
    if not check_postgres_available():
        print("❌ PostgreSQL 服务不可用，请确保 PostgreSQL 已启动并配置正确")
        print("   配置信息:")
        print(f"     主机: {Config.DB_HOST}")
        print(f"     端口: {Config.DB_PORT}")
        print(f"     用户: {Config.DB_USER}")
        print(f"     数据库: {Config.DB_NAME}")
        return False
    
    db_exists = database_exists()
    
    if db_exists and not force:
        print("ℹ️  air_quality 数据库已存在，跳过初始化")
        print("   如需重新初始化，请运行: python3 backend/db_init.py --force")
        return True
    
    if force and db_exists:
        print("⚠️  强制重新初始化，将删除现有数据库...")
        engine = get_default_db_engine()
        with engine.connect() as conn:
            conn.execute(text("DROP DATABASE IF EXISTS air_quality WITH (FORCE)"))
    
    try:
        create_database()
        create_extensions()
        create_tables()
        
        engine = get_air_quality_engine()
        insert_stations(engine)
        air_quality = insert_air_quality_data(engine)
        insert_traffic_data(engine)
        insert_construction_sites(engine)
        insert_complaints(engine)
        insert_events(engine)
        compute_and_insert_aggregates(engine, air_quality)
        insert_data_update_log(engine, len(air_quality), 7210, 120)
        
        print("\n" + "=" * 60)
        print("✅ 数据库初始化完成!")
        print("=" * 60)
        print("\n数据概览:")
        print(f"  - 监测站点: 10个")
        print(f"  - 空气质量原始数据: {len(air_quality)} 条 (30天)")
        print(f"  - 小时级聚合数据: 已计算并写入 air_quality_hourly")
        print(f"  - 日级聚合数据: 已计算并写入 air_quality_daily")
        print(f"  - 交通流量数据: 7210 条")
        print(f"  - 施工工地: 6 个")
        print(f"  - 投诉记录: ~120 条")
        print(f"  - 事件注释: 5 条")
        print("\n现在可以设置 USE_MOCK_DATA=false 启用真实数据库模式")
        print("数据追溯验证 (原始→聚合) 已可在真实DB下工作")
        return True
        
    except Exception as e:
        print(f"\n❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    force = '--force' in sys.argv
    success = init_database(force=force)
    sys.exit(0 if success else 1)
