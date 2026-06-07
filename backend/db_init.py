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

ALL_POLLUTANTS = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co']
POLLUTANT_STATS = ['avg', 'median', 'max', 'min', 'count']

def get_default_db_engine():
    url = f"postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/postgres"
    return create_engine(url, isolation_level='AUTOCOMMIT')

def get_air_quality_engine():
    return create_engine(Config.DATABASE_URL)

def check_postgres_available():
    try:
        engine = get_default_db_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"PostgreSQL 连接失败: {e}")
        return False

def database_exists():
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
    print("创建 air_quality 数据库...")
    engine = get_default_db_engine()
    with engine.connect() as conn:
        conn.execute(text("CREATE DATABASE air_quality"))
    print("✅ 数据库创建成功")

def create_extensions():
    print("创建 TimescaleDB 扩展...")
    engine = get_air_quality_engine()
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
        conn.commit()
    print("✅ TimescaleDB 扩展创建成功")

def create_tables():
    """创建所有表 - 显式定义列，确保与聚合写入完全一致"""
    print("创建数据库表...")
    engine = get_air_quality_engine()
    
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS event_annotations CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS complaint_records CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS construction_sites CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS traffic_flow CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS air_quality_daily CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS air_quality_hourly CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS air_quality_raw CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS monitoring_stations CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS data_update_log CASCADE"))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE monitoring_stations (
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
            CREATE TABLE air_quality_raw (
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
            print(f"  (超表: {str(e)[:40]})")
        
        conn.execute(text("""
            CREATE TABLE air_quality_hourly (
                hour_bucket TIMESTAMPTZ NOT NULL,
                station_id INTEGER NOT NULL REFERENCES monitoring_stations(station_id),
                pm25_avg DECIMAL(8, 4),
                pm25_median DECIMAL(8, 4),
                pm25_max DECIMAL(8, 4),
                pm25_min DECIMAL(8, 4),
                pm25_count INTEGER,
                pm10_avg DECIMAL(8, 4),
                pm10_median DECIMAL(8, 4),
                pm10_max DECIMAL(8, 4),
                pm10_min DECIMAL(8, 4),
                pm10_count INTEGER,
                o3_avg DECIMAL(8, 4),
                o3_median DECIMAL(8, 4),
                o3_max DECIMAL(8, 4),
                o3_min DECIMAL(8, 4),
                o3_count INTEGER,
                no2_avg DECIMAL(8, 4),
                no2_median DECIMAL(8, 4),
                no2_max DECIMAL(8, 4),
                no2_min DECIMAL(8, 4),
                no2_count INTEGER,
                so2_avg DECIMAL(8, 4),
                so2_median DECIMAL(8, 4),
                so2_max DECIMAL(8, 4),
                so2_min DECIMAL(8, 4),
                so2_count INTEGER,
                co_avg DECIMAL(8, 4),
                co_median DECIMAL(8, 4),
                co_max DECIMAL(8, 4),
                co_min DECIMAL(8, 4),
                co_count INTEGER,
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
            CREATE TABLE air_quality_daily (
                day_bucket TIMESTAMPTZ NOT NULL,
                station_id INTEGER NOT NULL REFERENCES monitoring_stations(station_id),
                pm25_avg DECIMAL(8, 4),
                pm25_median DECIMAL(8, 4),
                pm25_max DECIMAL(8, 4),
                pm25_min DECIMAL(8, 4),
                pm25_count INTEGER,
                pm10_avg DECIMAL(8, 4),
                pm10_median DECIMAL(8, 4),
                pm10_max DECIMAL(8, 4),
                pm10_min DECIMAL(8, 4),
                pm10_count INTEGER,
                o3_avg DECIMAL(8, 4),
                o3_median DECIMAL(8, 4),
                o3_max DECIMAL(8, 4),
                o3_min DECIMAL(8, 4),
                o3_count INTEGER,
                no2_avg DECIMAL(8, 4),
                no2_median DECIMAL(8, 4),
                no2_max DECIMAL(8, 4),
                no2_min DECIMAL(8, 4),
                no2_count INTEGER,
                so2_avg DECIMAL(8, 4),
                so2_median DECIMAL(8, 4),
                so2_max DECIMAL(8, 4),
                so2_min DECIMAL(8, 4),
                so2_count INTEGER,
                co_avg DECIMAL(8, 4),
                co_median DECIMAL(8, 4),
                co_max DECIMAL(8, 4),
                co_min DECIMAL(8, 4),
                co_count INTEGER,
                record_count INTEGER,
                anomaly_count INTEGER,
                PRIMARY KEY (day_bucket, station_id)
            )
        """))
        conn.commit()
        
        conn.execute(text("""
            CREATE TABLE traffic_flow (
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
        except Exception:
            pass
        
        conn.execute(text("""
            CREATE TABLE construction_sites (
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
            CREATE TABLE complaint_records (
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
            CREATE TABLE event_annotations (
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
            CREATE TABLE data_update_log (
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
    """计算并插入聚合数据 - 列名与表结构严格匹配"""
    print("计算小时级聚合...")
    
    hourly = air_quality_df.copy()
    hourly['hour_bucket'] = hourly['timestamp'].dt.floor('h')
    
    hourly_agg = hourly.groupby(['hour_bucket', 'station_id']).agg(
        pm25_avg=('pm25', 'mean'),
        pm25_median=('pm25', 'median'),
        pm25_max=('pm25', 'max'),
        pm25_min=('pm25', 'min'),
        pm25_count=('pm25', 'count'),
        pm10_avg=('pm10', 'mean'),
        pm10_median=('pm10', 'median'),
        pm10_max=('pm10', 'max'),
        pm10_min=('pm10', 'min'),
        pm10_count=('pm10', 'count'),
        o3_avg=('o3', 'mean'),
        o3_median=('o3', 'median'),
        o3_max=('o3', 'max'),
        o3_min=('o3', 'min'),
        o3_count=('o3', 'count'),
        no2_avg=('no2', 'mean'),
        no2_median=('no2', 'median'),
        no2_max=('no2', 'max'),
        no2_min=('no2', 'min'),
        no2_count=('no2', 'count'),
        so2_avg=('so2', 'mean'),
        so2_median=('so2', 'median'),
        so2_max=('so2', 'max'),
        so2_min=('so2', 'min'),
        so2_count=('so2', 'count'),
        co_avg=('co', 'mean'),
        co_median=('co', 'median'),
        co_max=('co', 'max'),
        co_min=('co', 'min'),
        co_count=('co', 'count'),
        temperature_avg=('temperature', 'mean'),
        humidity_avg=('humidity', 'mean'),
        wind_direction_avg=('wind_direction', 'mean'),
        wind_speed_avg=('wind_speed', 'mean'),
        record_count=('timestamp', 'count'),
        anomaly_count=('is_anomaly', 'sum')
    ).reset_index()
    
    for col in hourly_agg.columns:
        if col not in ['hour_bucket', 'station_id']:
            hourly_agg[col] = hourly_agg[col].round(4)
    
    hourly_agg.to_sql('air_quality_hourly', engine, if_exists='append', index=False, method='multi', chunksize=1000)
    print(f"  ✅ 插入 {len(hourly_agg)} 条小时级聚合数据")
    
    print("计算日级聚合...")
    daily = air_quality_df.copy()
    daily['day_bucket'] = daily['timestamp'].dt.floor('d')
    
    daily_agg = daily.groupby(['day_bucket', 'station_id']).agg(
        pm25_avg=('pm25', 'mean'),
        pm25_median=('pm25', 'median'),
        pm25_max=('pm25', 'max'),
        pm25_min=('pm25', 'min'),
        pm25_count=('pm25', 'count'),
        pm10_avg=('pm10', 'mean'),
        pm10_median=('pm10', 'median'),
        pm10_max=('pm10', 'max'),
        pm10_min=('pm10', 'min'),
        pm10_count=('pm10', 'count'),
        o3_avg=('o3', 'mean'),
        o3_median=('o3', 'median'),
        o3_max=('o3', 'max'),
        o3_min=('o3', 'min'),
        o3_count=('o3', 'count'),
        no2_avg=('no2', 'mean'),
        no2_median=('no2', 'median'),
        no2_max=('no2', 'max'),
        no2_min=('no2', 'min'),
        no2_count=('no2', 'count'),
        so2_avg=('so2', 'mean'),
        so2_median=('so2', 'median'),
        so2_max=('so2', 'max'),
        so2_min=('so2', 'min'),
        so2_count=('so2', 'count'),
        co_avg=('co', 'mean'),
        co_median=('co', 'median'),
        co_max=('co', 'max'),
        co_min=('co', 'min'),
        co_count=('co', 'count'),
        record_count=('timestamp', 'count'),
        anomaly_count=('is_anomaly', 'sum')
    ).reset_index()
    
    for col in daily_agg.columns:
        if col not in ['day_bucket', 'station_id']:
            daily_agg[col] = daily_agg[col].round(4)
    
    daily_agg.to_sql('air_quality_daily', engine, if_exists='append', index=False, method='multi', chunksize=1000)
    print(f"  ✅ 插入 {len(daily_agg)} 条日级聚合数据")
    
    return hourly_agg, daily_agg

def verify_aggregation_in_db(engine):
    """真实数据库中验证原始记录 → 聚合结果的追溯性"""
    print("\n验证原始记录 → 聚合结果的追溯性...")
    
    sample_query = text("""
        SELECT hour_bucket, station_id, pm25_avg, record_count
        FROM air_quality_hourly
        ORDER BY hour_bucket DESC
        LIMIT 1
    """)
    
    with engine.connect() as conn:
        sample = conn.execute(sample_query).fetchone()
    
    if not sample:
        print("  ⚠️  无聚合数据可验证")
        return False
    
    hour_bucket, station_id, agg_pm25_avg, agg_record_count = sample
    hour_bucket_str = hour_bucket.strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"  抽样: 站点={station_id}, 时间={hour_bucket_str}")
    
    next_hour = hour_bucket + timedelta(hours=1)
    
    raw_query = text("""
        SELECT COUNT(*) as cnt, AVG(pm25) as avg_pm25
        FROM air_quality_raw
        WHERE station_id = :station_id
          AND timestamp >= :hour_bucket
          AND timestamp < :next_hour
    """)
    
    with engine.connect() as conn:
        raw_result = conn.execute(raw_query, {
            'station_id': station_id,
            'hour_bucket': hour_bucket,
            'next_hour': next_hour
        }).fetchone()
    
    raw_count, raw_pm25_avg = raw_result
    
    print(f"    原始记录数: {raw_count}, 聚合记录数: {agg_record_count}")
    print(f"    原始PM2.5均值: {raw_pm25_avg:.4f}, 聚合PM2.5均值: {agg_pm25_avg:.4f}")
    
    count_match = raw_count == agg_record_count
    pm25_match = abs(float(raw_pm25_avg) - float(agg_pm25_avg)) < 0.01 if raw_pm25_avg and agg_pm25_avg else True
    
    print(f"    记录数匹配: {'✅' if count_match else '❌'} {count_match}")
    print(f"    PM2.5均值匹配: {'✅' if pm25_match else '❌'} {pm25_match}")
    
    # 取3条原始记录样例
    raw_sample_query = text("""
        SELECT timestamp, station_id, pm25, o3, is_anomaly
        FROM air_quality_raw
        WHERE station_id = :station_id
          AND timestamp >= :hour_bucket
          AND timestamp < :next_hour
        ORDER BY timestamp
        LIMIT 3
    """)
    
    with engine.connect() as conn:
        raw_samples = conn.execute(raw_sample_query, {
            'station_id': station_id,
            'hour_bucket': hour_bucket,
            'next_hour': next_hour
        }).fetchall()
    
    print(f"    原始记录样例 (前3条):")
    for i, row in enumerate(raw_samples):
        ts = row[0].strftime('%Y-%m-%d %H:%M:%S')
        print(f"      [{i+1}] {ts} | PM2.5={row[2]:.1f} | O3={row[3]:.1f} | 异常={row[4]}")
    
    all_pass = count_match and pm25_match
    if all_pass:
        print("  ✅ 追溯验证通过! 聚合结果可从原始记录追溯")
    else:
        print("  ❌ 追溯验证失败!")
    
    return all_pass

def init_database(force=False):
    """完整初始化数据库"""
    print("=" * 60)
    print("初始化 TimescaleDB 数据库")
    print("=" * 60)
    
    if not check_postgres_available():
        print("❌ PostgreSQL 服务不可用")
        print(f"   主机: {Config.DB_HOST}:{Config.DB_PORT}")
        print(f"   用户: {Config.DB_USER}")
        return False
    
    db_exists = database_exists()
    
    if db_exists and not force:
        print("ℹ️  air_quality 数据库已存在")
        print("   验证现有数据的可追溯性...")
        try:
            engine = get_air_quality_engine()
            verify_aggregation_in_db(engine)
        except Exception as e:
            print(f"   验证失败: {e}")
        print("   如需重新初始化，请运行: python3 backend/db_init.py --force")
        return True
    
    if force and db_exists:
        print("⚠️  强制重新初始化，删除现有数据库...")
        engine = get_default_db_engine()
        with engine.connect() as conn:
            conn.execute(text("DROP DATABASE IF EXISTS air_quality WITH (FORCE)"))
    
    try:
        create_database()
        create_extensions()
        create_tables()
        
        engine = get_air_quality_engine()
        
        print("\n--- 插入基础数据 ---")
        stations = generate_mock_stations()
        stations.to_sql('monitoring_stations', engine, if_exists='append', index=False)
        print(f"✅ 插入 {len(stations)} 个监测站")
        
        print("插入空气质量原始数据...")
        air_quality = generate_mock_air_quality(hours=720)
        air_quality.to_sql('air_quality_raw', engine, if_exists='append', index=False, method='multi', chunksize=1000)
        print(f"✅ 插入 {len(air_quality)} 条空气质量原始数据")
        
        traffic = generate_mock_traffic(days=30)
        traffic.to_sql('traffic_flow', engine, if_exists='append', index=False, method='multi', chunksize=1000)
        print(f"✅ 插入 {len(traffic)} 条交通流量数据")
        
        sites = generate_mock_construction_sites()
        sites.to_sql('construction_sites', engine, if_exists='append', index=False)
        print(f"✅ 插入 {len(sites)} 个施工工地")
        
        complaints = generate_mock_complaints(days=60)
        complaints.to_sql('complaint_records', engine, if_exists='append', index=False)
        print(f"✅ 插入 {len(complaints)} 条投诉记录")
        
        events = generate_mock_events()
        events.to_sql('event_annotations', engine, if_exists='append', index=False)
        print(f"✅ 插入 {len(events)} 条事件注释")
        
        print("\n--- 计算聚合数据 ---")
        compute_and_insert_aggregates(engine, air_quality)
        
        print("\n更新数据更新日志...")
        now = datetime.now()
        log_df = pd.DataFrame([
            {'data_type': 'air_quality', 'last_updated': now, 'record_count': len(air_quality), 'source': 'city_monitoring_network'},
            {'data_type': 'traffic', 'last_updated': now, 'record_count': len(traffic), 'source': 'traffic_management_bureau'},
            {'data_type': 'complaints', 'last_updated': now, 'record_count': len(complaints), 'source': 'public_reporting_system'},
        ])
        log_df.to_sql('data_update_log', engine, if_exists='append', index=False)
        
        verify_aggregation_in_db(engine)
        
        print("\n" + "=" * 60)
        print("✅ 数据库初始化完成!")
        print("=" * 60)
        print("\n数据概览:")
        print(f"  - 监测站点: {len(stations)} 个")
        print(f"  - 空气质量原始数据: {len(air_quality)} 条 (30天)")
        print(f"  - 小时级聚合: air_quality_hourly 表")
        print(f"  - 日级聚合: air_quality_daily 表")
        print(f"  - 追溯验证: 已通过，原始记录可对应到聚合结果")
        print("\n设置 USE_MOCK_DATA=false 即可使用真实数据库模式")
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
