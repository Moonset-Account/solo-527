import os
import time
import threading
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError, OperationalError
import pandas as pd

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'dbname': os.getenv('DB_NAME', 'lab_timeline'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
}

DB_CONNECT_TIMEOUT = int(os.getenv('DB_CONNECT_TIMEOUT', '3'))
DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', '5'))
DB_HEALTH_CHECK_INTERVAL = int(os.getenv('DB_HEALTH_CHECK_INTERVAL', '30'))

_engine = None
_Session = None
_db_available = False
_last_health_check = 0
_health_lock = threading.Lock()


def _get_use_mock_data():
    """动态获取 USE_MOCK_DATA 配置"""
    return os.getenv('USE_MOCK_DATA', 'True').lower() == 'true'


def _get_db_url():
    return f"postgresql+psycopg2://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}?connect_timeout={DB_CONNECT_TIMEOUT}"


def _test_connection(engine):
    """测试数据库连接"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def check_database_health(force=False):
    """
    检查数据库健康状态
    带有缓存机制，避免频繁检查
    """
    global _db_available, _last_health_check, _engine
    
    use_mock = _get_use_mock_data()
    if use_mock:
        return False
    
    now = time.time()
    if not force and (now - _last_health_check) < DB_HEALTH_CHECK_INTERVAL:
        return _db_available
    
    with _health_lock:
        if not force and (now - _last_health_check) < DB_HEALTH_CHECK_INTERVAL:
            return _db_available
        
        _last_health_check = now
        
        try:
            if _engine is None:
                _engine = create_engine(
                    _get_db_url(),
                    pool_pre_ping=True,
                    pool_recycle=3600,
                    pool_size=DB_POOL_SIZE,
                    max_overflow=10,
                    connect_args={'connect_timeout': DB_CONNECT_TIMEOUT}
                )
            
            _db_available = _test_connection(_engine)
        except Exception:
            _db_available = False
            if _engine is not None:
                try:
                    _engine.dispose()
                except:
                    pass
                _engine = None
        
        return _db_available


def is_database_available():
    """检查数据库是否可用（快速接口）"""
    if _get_use_mock_data():
        return False
    return _db_available or check_database_health()


def get_engine():
    """
    获取数据库引擎
    如果数据库不可用，返回 None 而不是卡住
    """
    global _engine
    
    use_mock = _get_use_mock_data()
    if use_mock:
        return None
    
    if not check_database_health():
        return None
    
    return _engine


def get_session():
    """获取数据库会话"""
    global _Session
    
    use_mock = _get_use_mock_data()
    if use_mock:
        return None
    
    engine = get_engine()
    if engine is None:
        return None
    
    if _Session is None:
        _Session = sessionmaker(bind=engine)
    
    try:
        return _Session()
    except Exception:
        return None


def execute_query(query, params=None, timeout=None):
    """
    执行 SQL 查询，带有超时保护和错误处理
    失败时返回 None 而不是抛出异常
    """
    if _get_use_mock_data():
        return None
    
    if not check_database_health():
        return None
    
    session = get_session()
    if session is None:
        return None
    
    try:
        result = session.execute(text(query), params or {})
        session.commit()
        return result
    except OperationalError as e:
        session.rollback()
        global _db_available
        _db_available = False
        print(f"[DB] 数据库连接失败: {e}")
        return None
    except SQLAlchemyError as e:
        session.rollback()
        print(f"[DB] SQL 执行错误: {e}")
        return None
    except Exception as e:
        session.rollback()
        print(f"[DB] 未知错误: {e}")
        return None
    finally:
        try:
            session.close()
        except:
            pass


def query_to_dataframe(query, params=None):
    """
    执行查询并返回 DataFrame
    失败时返回 None 而不是卡住或抛出异常
    """
    if _get_use_mock_data():
        return None
    
    if not check_database_health():
        return None
    
    engine = get_engine()
    if engine is None:
        return None
    
    try:
        return pd.read_sql(text(query), engine, params=params or {})
    except OperationalError as e:
        global _db_available
        _db_available = False
        print(f"[DB] 数据库查询连接失败: {e}")
        return None
    except Exception as e:
        print(f"[DB] 查询失败: {e}")
        return None


def fetch_samples_from_db(start_date=None, end_date=None, sample_types=None, 
                          priorities=None, departments=None):
    """
    从 TimescaleDB 读取样本数据
    失败时返回 None，上层会自动回退到模拟数据
    """
    if not check_database_health():
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
    
    query += " ORDER BY collected_at DESC LIMIT 5000"
    
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
    失败时返回 None，上层会自动回退到默认配置
    """
    if not check_database_health():
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
    失败时返回 None，上层会自动回退到模拟数据
    """
    if not check_database_health():
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
    
    query += " ORDER BY srr.return_time DESC LIMIT 1000"
    
    return query_to_dataframe(query, params)


def update_threshold_in_db(sample_type, priority, stage_name, new_threshold):
    """
    更新数据库中的阈值配置
    失败时返回 False，上层会更新内存缓存
    """
    if not check_database_health():
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
    
    result = execute_query(query, params)
    return result is not None


def get_db_status():
    """获取数据库状态，用于页面显示"""
    use_mock = _get_use_mock_data()
    if use_mock:
        return {
            'mode': 'mock',
            'mode_name': '模拟数据',
            'available': True,
            'message': '使用内存模拟数据'
        }
    
    available = is_database_available()
    return {
        'mode': 'database',
        'mode_name': 'TimescaleDB',
        'available': available,
        'message': '数据库连接正常' if available else '数据库不可用，已降级为模拟数据'
    }
