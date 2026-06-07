import os
import pandas as pd
from datetime import datetime
from typing import Tuple, Optional, List, Dict
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()


class ColdChainDatabase:
    """
    冷链疫苗温度数据库 - 强制 TimescaleDB
    所有数据直接从 TimescaleDB 的 shipments / temperature_samples 表查询
    无模拟数据 fallback
    """
    
    def __init__(self):
        self.engine = None
        self.connected = False
        self.connection_error = None
        self._connect()
    
    def _connect(self):
        """强制连接 TimescaleDB，失败则记录错误"""
        host = os.getenv("TIMESCALEDB_HOST", "localhost")
        port = os.getenv("TIMESCALEDB_PORT", "5432")
        user = os.getenv("TIMESCALEDB_USER", "postgres")
        password = os.getenv("TIMESCALEDB_PASSWORD", "postgres")
        database = os.getenv("TIMESCALEDB_DATABASE", "cold_chain")
        
        try:
            conn_str = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
            self.engine = create_engine(conn_str, pool_pre_ping=True, pool_recycle=3600)
            
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE"))
                conn.commit()
            
            self._init_schema()
            self.connected = True
            print(f"[✓] TimescaleDB 已连接: {host}:{port}/{database}")
            
        except Exception as e:
            self.connection_error = str(e)
            self.connected = False
            print(f"[✗] TimescaleDB 连接失败: {e}")
            raise RuntimeError(
                f"无法连接 TimescaleDB。请配置 .env 文件或确保数据库运行。\n"
                f"错误详情: {e}"
            )
    
    def _init_schema(self):
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
            
            conn.execute(text("""
                SELECT create_hypertable(
                    'temperature_samples', 
                    'timestamp',
                    if_not_exists => TRUE,
                    chunk_time_interval => INTERVAL '1 day'
                )
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_samples_shipment_time 
                ON temperature_samples(shipment_id, timestamp DESC)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_samples_box_time 
                ON temperature_samples(box_id, timestamp DESC)
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
    
    def check_connection(self) -> Tuple[bool, str]:
        """检查连接状态"""
        if not self.connected:
            return False, self.connection_error or "未连接"
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True, "正常"
        except Exception as e:
            return False, str(e)
    
    def get_all_shipments(self) -> pd.DataFrame:
        """从 shipments 表查询所有运输批次"""
        query = text("SELECT * FROM shipments ORDER BY signoff_time DESC")
        with self.engine.connect() as conn:
            df = pd.read_sql(query, conn)
        if "signoff_time" in df.columns:
            df["signoff_time"] = pd.to_datetime(df["signoff_time"])
        return df
    
    def get_all_samples(self) -> pd.DataFrame:
        """从 temperature_samples 表查询所有温度采样"""
        query = text("SELECT * FROM temperature_samples ORDER BY timestamp")
        with self.engine.connect() as conn:
            df = pd.read_sql(query, conn)
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
        return df
    
    def get_samples_by_box(self, box_id: str) -> pd.DataFrame:
        """按箱号查询温度采样"""
        query = text("""
            SELECT * FROM temperature_samples 
            WHERE box_id = :box_id 
            ORDER BY timestamp
        """)
        with self.engine.connect() as conn:
            df = pd.read_sql(query, conn, params={"box_id": box_id})
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
        return df
    
    def get_daily_stats(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        exclude_review: bool = True
    ) -> pd.DataFrame:
        """
        使用 TimescaleDB time_bucket 查询每日统计
        排除复核/申诉中的批次
        """
        params: Dict = {}
        
        query = """
            SELECT 
                time_bucket('1 day', ts.timestamp) as bucket,
                COUNT(DISTINCT s.shipment_id) as shipment_count,
                COUNT(*) as sample_count,
                AVG(ts.temperature) as avg_temp,
                MAX(ts.temperature) as max_temp,
                MIN(ts.temperature) as min_temp,
                SUM(CASE WHEN ts.temperature > 8 OR ts.temperature < 2 THEN 1 ELSE 0 END) as anomaly_count
            FROM temperature_samples ts
            JOIN shipments s ON ts.shipment_id = s.shipment_id
            WHERE 1=1
        """
        
        if exclude_review:
            query += " AND s.review_status NOT IN ('pending', 'appealed')"
        
        if start_date:
            query += " AND ts.timestamp >= :start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND ts.timestamp <= :end_date"
            params["end_date"] = end_date
        
        query += " GROUP BY 1 ORDER BY bucket DESC"
        
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)
        
        return df
    
    def get_route_compliance(self, exclude_review: bool = True) -> pd.DataFrame:
        """查询各路线合规率（从数据库聚合）"""
        query = """
            SELECT 
                s.route,
                COUNT(*) as shipment_count,
                AVG(s.sample_count) as avg_samples
            FROM shipments s
            WHERE 1=1
        """
        if exclude_review:
            query += " AND s.review_status NOT IN ('pending', 'appealed')"
        
        query += " GROUP BY s.route ORDER BY shipment_count DESC"
        
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
        
        return df
    
    def is_empty(self) -> bool:
        """检查数据库是否为空"""
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM shipments"))
            count = result.scalar()
            return count == 0
    
    def load_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """加载所有数据（仪表板用）"""
        df_shipments = self.get_all_shipments()
        df_samples = self.get_all_samples()
        return df_shipments, df_samples
    
    def import_sample_data(self, df_shipments: pd.DataFrame, df_samples: pd.DataFrame):
        """导入示例数据到数据库"""
        df_shipments_write = df_shipments.copy()
        if "shipment_id" in df_shipments_write.columns:
            df_shipments_write = df_shipments_write.drop(columns=["shipment_id"])
        
        df_shipments_write.to_sql(
            "shipments", 
            self.engine, 
            if_exists="append", 
            index=False,
            method="multi"
        )
        
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT shipment_id, box_id FROM shipments"))
            box_id_map = {row[1]: row[0] for row in result.fetchall()}
        
        df_samples_write = df_samples.copy()
        df_samples_write["shipment_id"] = df_samples_write["box_id"].map(box_id_map)
        if "sample_id" in df_samples_write.columns:
            df_samples_write = df_samples_write.drop(columns=["sample_id"])
        
        df_samples_write.to_sql(
            "temperature_samples", 
            self.engine, 
            if_exists="append", 
            index=False,
            method="multi"
        )
        
        print(f"[✓] 已导入 {len(df_shipments)} 条运输，{len(df_samples)} 条采样到 TimescaleDB")
    
    def update_review_status(self, box_id: str, review_status: str, review_note: str = ""):
        """更新复核状态"""
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


def get_database() -> ColdChainDatabase:
    """
    获取数据库连接（强制 TimescaleDB）
    - 连接失败直接抛出异常
    - 数据库为空不自动灌入数据，由上层提示用户
    """
    db = ColdChainDatabase()
    return db
