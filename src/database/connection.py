import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pandas as pd

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'dbname': os.getenv('DB_NAME', 'lab_timeline'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
}

USE_MOCK_DATA = os.getenv('USE_MOCK_DATA', 'True').lower() == 'true'

_engine = None
_Session = None


def get_engine():
    global _engine
    if _engine is None and not USE_MOCK_DATA:
        db_url = f"postgresql+psycopg2://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
        _engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=3600)
    return _engine


def get_session():
    global _Session
    if _Session is None and not USE_MOCK_DATA:
        _Session = sessionmaker(bind=get_engine())
    return _Session() if _Session else None


def execute_query(query, params=None):
    if USE_MOCK_DATA:
        return None
    session = get_session()
    try:
        result = session.execute(text(query), params or {})
        session.commit()
        return result
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


def query_to_dataframe(query, params=None):
    if USE_MOCK_DATA:
        return None
    engine = get_engine()
    return pd.read_sql(text(query), engine, params=params or {})


def fetch_samples_from_db(start_date=None, end_date=None, sample_types=None, 
                          priorities=None, departments=None):
    """
    从 TimescaleDB 读取样本数据
    """
    if USE_MOCK_DATA:
        return None
    
    query = """
    SELECT 
        sample_id,
        sample_type,
        priority,
        requesting_department,
        patient_id,
        collected_at,
        collected_at_source,
        dispatched_at,
        dispatched_at_source,
        received_at,
        received_at_source,
        tested_at,
        tested_at_source,
        reviewed_at,
        reviewed_at_source,
        reported_at,
        reported_at_source,
        status,
        test_items
    FROM lab_samples
    WHERE 1=1
    """
    params = {}
    
    if start_date:
        query += " AND collected_at >= :start_date"
        params['start_date'] = start_date
    if end_date:
        query += " AND collected_at <= :end_date"
        params['end_date'] = end_date
    if sample_types and len(sample_types) > 0:
        query += " AND sample_type = ANY(:sample_types)"
        params['sample_types'] = sample_types
    if priorities and len(priorities) > 0:
        query += " AND priority = ANY(:priorities)"
        params['priorities'] = priorities
    if departments and len(departments) > 0:
        query += " AND requesting_department = ANY(:departments)"
        params['departments'] = departments
    
    query += " ORDER BY collected_at DESC"
    
    df = query_to_dataframe(query, params)
    
    if df is not None and not df.empty:
        type_names = {
            'blood': '血液', 'urine': '尿液', 'stool': '粪便',
            'biochemistry': '生化', 'immunology': '免疫', 'microbiology': '微生物'
        }
        df['sample_type_name'] = df['sample_type'].map(type_names).fillna(df['sample_type'])
        df['priority_name'] = df['priority'].map({'emergency': '急诊', 'routine': '常规'}).fillna(df['priority'])
    
    return df


def fetch_thresholds_from_db():
    """
    从 TimescaleDB 读取阈值配置
    """
    if USE_MOCK_DATA:
        return None
    
    query = """
    SELECT 
        id,
        sample_type,
        priority,
        stage_name,
        threshold_minutes,
        description,
        created_at,
        updated_at
    FROM threshold_configs
    ORDER BY sample_type, priority, stage_name
    """
    
    df = query_to_dataframe(query)
    
    if df is not None and not df.empty:
        type_names = {
            'blood': '血液', 'urine': '尿液', 'stool': '粪便',
            'biochemistry': '生化', 'immunology': '免疫', 'microbiology': '微生物'
        }
        stage_names = {
            'collection_to_dispatch': '采样→送检',
            'dispatch_to_receive': '送检→接收',
            'receive_to_test': '接收→检测',
            'test_to_review': '检测→复核',
            'review_to_report': '复核→发布'
        }
        df['sample_type_name'] = df['sample_type'].map(type_names).fillna(df['sample_type'])
        df['priority_name'] = df['priority'].map({'emergency': '急诊', 'routine': '常规'}).fillna(df['priority'])
        df['stage_display_name'] = df['stage_name'].map(stage_names).fillna(df['stage_name'])
    
    return df


def fetch_returns_from_db(start_date=None, end_date=None):
    """
    从 TimescaleDB 读取退回记录
    """
    if USE_MOCK_DATA:
        return None
    
    query = """
    SELECT 
        srr.id,
        srr.sample_id,
        srr.return_time,
        srr.return_reason,
        srr.responsible_department,
        srr.returned_by,
        srr.notes,
        srr.created_at
    FROM sample_return_records srr
    JOIN lab_samples ls ON srr.sample_id = ls.sample_id
    WHERE 1=1
    """
    params = {}
    
    if start_date:
        query += " AND ls.collected_at >= :start_date"
        params['start_date'] = start_date
    if end_date:
        query += " AND ls.collected_at <= :end_date"
        params['end_date'] = end_date
    
    query += " ORDER BY srr.return_time DESC"
    
    return query_to_dataframe(query, params)


def update_threshold_in_db(sample_type, priority, stage_name, new_threshold):
    """
    更新数据库中的阈值配置
    """
    if USE_MOCK_DATA:
        return False
    
    query = """
    INSERT INTO threshold_configs (sample_type, priority, stage_name, threshold_minutes, updated_at)
    VALUES (:sample_type, :priority, :stage_name, :threshold_minutes, NOW())
    ON CONFLICT (sample_type, priority, stage_name) 
    DO UPDATE SET 
        threshold_minutes = EXCLUDED.threshold_minutes,
        updated_at = NOW()
    """
    
    params = {
        'sample_type': sample_type,
        'priority': priority,
        'stage_name': stage_name,
        'threshold_minutes': new_threshold
    }
    
    try:
        execute_query(query, params)
        return True
    except Exception as e:
        print(f"更新阈值失败: {e}")
        return False
