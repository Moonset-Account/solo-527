import os
import pandas as pd
from datetime import datetime
from typing import Tuple, Optional
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()


class ColdChainTimescaleDB:
    """
    冷链疫苗温度数据库 - TimescaleDB 专用
    支持时序表 (hypertable)、分桶查询、原生时间序列操作
    """
    
    def __init__(self):
        self.use_timescaledb = os.getenv("USE_TIMESCALEDB", "true").lower() == "true"
        self.engine = None
        self.connected = False
        self.error_msg = None
        
        try:
            if self.use_timescaledb:
                self._connect_timescaledb()
            else:
                self._connect_fallback()
        except Exception as e:
            self.error_msg = str(e)
            print(f"[警告] 数据库连接失败: {e}")
            self._connect_fallback()
    
    def _connect_timescaledb(self):
        """连接 TimescaleDB 并初始化 hypertable"""
        host = os.getenv("TIMESCALEDB_HOST", "localhost")
        port = os.getenv("TIMESCALEDB_PORT", "5432")
        user = os.getenv("TIMESCALEDB_USER", "postgres")
        password = os.getenv("TIMESCALEDB_PASSWORD", "postgres")
        database = os.getenv("TIMESCALEDB_DATABASE", "cold_chain")
        
        conn_str = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
        self.engine = create_engine(conn_str, pool_pre_ping=True)
        
        with self.engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE"))
            conn.commit()
        
        self._init_timescaledb_schema()
        self.connected = True
        print(f"[✓] 已连接 TimescaleDB: {host}:{port}/{database}")
    
    def _connect_fallback(self):
        """使用内置模拟数据（无需数据库）"""
        print("[!] 使用内置模拟数据模式（如需连接 TimescaleDB，请配置 .env 文件）")
        self.engine = None
        self.connected = False
    
    def _init_timescaledb_schema(self):
        """初始化 TimescaleDB 表结构和 hypertable"""
        with self.engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS shipments (
                    shipment_id SERIAL PRIMARY KEY,
                    box_id TEXT UNIQUE NOT NULL,
                    batch_no TEXT NOT NULL,
                    route TEXT NOT NULL,
                    from_station TEXT NOT NULL,
                    to_station TEXT NOT NULL,
                    signoff_time TIMESTAMPTZ,
                    status TEXT DEFAULT 'completed',
                    review_status TEXT DEFAULT 'none',
                    review_note TEXT DEFAULT '',
                    signoff_photo_url TEXT DEFAULT '',
                    sample_count INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS temperature_samples (
                    sample_id BIGSERIAL,
                    shipment_id INTEGER NOT NULL REFERENCES shipments(shipment_id),
                    box_id TEXT NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    temperature DOUBLE PRECISION,
                    is_anomaly BOOLEAN DEFAULT FALSE,
                    anomaly_reason TEXT DEFAULT '',
                    is_cleaned BOOLEAN DEFAULT FALSE,
                    cleaned_reason TEXT DEFAULT ''
                )
            """))
            
            result = conn.execute(text("""
                SELECT create_hypertable('temperature_samples', 'timestamp', 
                    if_not_exists => TRUE,
                    chunk_time_interval => INTERVAL '1 day')
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_samples_shipment_time 
                ON temperature_samples(shipment_id, timestamp DESC)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_shipments_batch 
                ON shipments(batch_no)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_shipments_review 
                ON shipments(review_status)
            """))
            
            conn.commit()
    
    def is_available(self) -> bool:
        return self.connected
    
    def is_empty(self) -> bool:
        if not self.connected:
            return True
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM shipments"))
                count = result.scalar()
                return count == 0
        except Exception:
            return True
    
    def get_shipments_with_time_bucket(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        exclude_review: bool = True
    ) -> pd.DataFrame:
        """
        使用 TimescaleDB time_bucket 查询运输数据
        """
        if not self.connected:
            return pd.DataFrame()
        
        query = """
            SELECT 
                s.*,
                COUNT(ts.sample_id) as actual_sample_count
            FROM shipments s
            LEFT JOIN temperature_samples ts ON s.shipment_id = ts.shipment_id
            WHERE 1=1
        """
        params = {}
        
        if start_date:
            query += " AND s.signoff_time >= :start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND s.signoff_time <= :end_date"
            params["end_date"] = end_date
        if exclude_review:
            query += " AND s.review_status NOT IN ('pending', 'appealed')"
        
        query += " GROUP BY s.shipment_id ORDER BY s.signoff_time DESC"
        
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)
        
        return df
    
    def get_temperature_stats(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        bucket_interval: str = '1 day'
    ) -> pd.DataFrame:
        """
        使用 TimescaleDB time_bucket 聚合温度统计
        """
        if not self.connected:
            return pd.DataFrame()
        
        query = f"""
            SELECT 
                time_bucket(:bucket_interval, ts.timestamp) as bucket,
                s.route,
                s.from_station,
                s.to_station,
                COUNT(*) as sample_count,
                AVG(ts.temperature) as avg_temp,
                MAX(ts.temperature) as max_temp,
                MIN(ts.temperature) as min_temp,
                SUM(CASE WHEN ts.temperature > 8 OR ts.temperature < 2 THEN 1 ELSE 0 END) as anomaly_count
            FROM temperature_samples ts
            JOIN shipments s ON ts.shipment_id = s.shipment_id
            WHERE 1=1
        """
        params = {"bucket_interval": bucket_interval}
        
        if start_date:
            query += " AND ts.timestamp >= :start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND ts.timestamp <= :end_date"
            params["end_date"] = end_date
        
        query += " GROUP BY 1, 2, 3, 4 ORDER BY bucket DESC"
        
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)
        
        return df
    
    def load_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """加载所有数据（兼容接口）"""
        if self.connected:
            df_shipments = pd.read_sql("SELECT * FROM shipments ORDER BY shipment_id", self.engine)
            df_samples = pd.read_sql("SELECT * FROM temperature_samples ORDER BY timestamp", self.engine)
            if "signoff_time" in df_shipments.columns:
                df_shipments["signoff_time"] = pd.to_datetime(df_shipments["signoff_time"])
            if "timestamp" in df_samples.columns:
                df_samples["timestamp"] = pd.to_datetime(df_samples["timestamp"])
            return df_shipments, df_samples
        else:
            from data_generator import generate_demo_data
            df_shipments, df_samples, _ = generate_demo_data()
            return df_shipments, df_samples
    
    def import_data(self, df_shipments: pd.DataFrame, df_samples: pd.DataFrame):
        """导入数据到 TimescaleDB"""
        if not self.connected:
            print("[!] 数据库未连接，跳过导入")
            return
        
        df_shipments_to_write = df_shipments.copy()
        if "shipment_id" in df_shipments_to_write.columns:
            df_shipments_to_write = df_shipments_to_write.drop(columns=["shipment_id"])
        
        df_shipments_to_write.to_sql(
            "shipments", 
            self.engine, 
            if_exists="append", 
            index=False,
            method="multi"
        )
        
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT shipment_id, box_id FROM shipments"))
            box_id_map = {row[1]: row[0] for row in result.fetchall()}
        
        df_samples_to_write = df_samples.copy()
        df_samples_to_write["shipment_id"] = df_samples_to_write["box_id"].map(box_id_map)
        if "sample_id" in df_samples_to_write.columns:
            df_samples_to_write = df_samples_to_write.drop(columns=["sample_id"])
        
        df_samples_to_write.to_sql(
            "temperature_samples", 
            self.engine, 
            if_exists="append", 
            index=False,
            method="multi"
        )
        
        print(f"[✓] 已导入 {len(df_shipments)} 条运输，{len(df_samples)} 条采样到 TimescaleDB")
    
    def update_review_status(self, box_id: str, review_status: str, review_note: str = ""):
        if not self.connected:
            return
        with self.engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE shipments 
                    SET review_status = :status, review_note = :note
                    WHERE box_id = :box_id
                """),
                {"status": review_status, "note": review_note, "box_id": box_id}
            )
            conn.commit()


def get_database(force_refresh: bool = False) -> ColdChainTimescaleDB:
    """
    获取数据库连接
    优先使用 TimescaleDB（配置 .env 即可）
    """
    db = ColdChainTimescaleDB()
    
    if db.is_available() and (force_refresh or db.is_empty()):
        print("[TimescaleDB] 初始化示例数据...")
        from data_generator import generate_demo_data
        df_shipments, df_samples, _ = generate_demo_data()
        db.import_data(df_shipments, df_samples)
    
    return db
