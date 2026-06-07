import os
import sqlite3
import pandas as pd
from datetime import datetime
from typing import Tuple, Optional
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()


class ColdChainDatabase:
    def __init__(self, use_timescaledb: bool = False):
        self.use_timescaledb = use_timescaledb
        self.db_path = "cold_chain.db"
        
        if use_timescaledb:
            self.engine = self._create_timescaledb_engine()
        else:
            self.engine = create_engine(f"sqlite:///{self.db_path}")
            self._init_sqlite_schema()
    
    def _create_timescaledb_engine(self):
        host = os.getenv("TIMESCALEDB_HOST", "localhost")
        port = os.getenv("TIMESCALEDB_PORT", "5432")
        user = os.getenv("TIMESCALEDB_USER", "postgres")
        password = os.getenv("TIMESCALEDB_PASSWORD", "postgres")
        database = os.getenv("TIMESCALEDB_DATABASE", "cold_chain")
        conn_str = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
        return create_engine(conn_str)
    
    def _init_sqlite_schema(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS shipments (
                    shipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    box_id TEXT UNIQUE NOT NULL,
                    batch_no TEXT NOT NULL,
                    route TEXT NOT NULL,
                    from_station TEXT NOT NULL,
                    to_station TEXT NOT NULL,
                    signoff_time TIMESTAMP,
                    status TEXT DEFAULT 'completed',
                    review_status TEXT DEFAULT 'none',
                    review_note TEXT DEFAULT '',
                    signoff_photo_url TEXT DEFAULT '',
                    sample_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS temperature_samples (
                    sample_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    shipment_id INTEGER NOT NULL,
                    box_id TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    temperature REAL,
                    is_anomaly INTEGER DEFAULT 0,
                    anomaly_reason TEXT DEFAULT '',
                    is_cleaned INTEGER DEFAULT 0,
                    cleaned_reason TEXT DEFAULT '',
                    FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
                )
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_samples_shipment 
                ON temperature_samples(shipment_id)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_samples_timestamp 
                ON temperature_samples(timestamp)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_shipments_batch 
                ON shipments(batch_no)
            """)
            
            conn.commit()
    
    def is_empty(self) -> bool:
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM shipments"))
                count = result.scalar()
                return count == 0
        except Exception:
            return True
    
    def import_data(self, df_shipments: pd.DataFrame, df_samples: pd.DataFrame):
        df_shipments_to_write = df_shipments.copy()
        if "shipment_id" in df_shipments_to_write.columns:
            df_shipments_to_write = df_shipments_to_write.drop(columns=["shipment_id"])
        
        df_shipments_to_write.to_sql(
            "shipments", 
            self.engine, 
            if_exists="append", 
            index=False
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
            index=False
        )
    
    def load_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        df_shipments = pd.read_sql("SELECT * FROM shipments", self.engine)
        df_samples = pd.read_sql("SELECT * FROM temperature_samples", self.engine)
        
        if "signoff_time" in df_shipments.columns:
            df_shipments["signoff_time"] = pd.to_datetime(df_shipments["signoff_time"])
        if "timestamp" in df_samples.columns:
            df_samples["timestamp"] = pd.to_datetime(df_samples["timestamp"])
        
        return df_shipments, df_samples
    
    def update_review_status(self, box_id: str, review_status: str, review_note: str = ""):
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


def get_database(force_new: bool = False) -> ColdChainDatabase:
    use_ts = os.getenv("USE_TIMESCALEDB", "false").lower() == "true"
    
    if force_new and not use_ts:
        db_path = "cold_chain.db"
        if os.path.exists(db_path):
            os.remove(db_path)
            print("已删除旧数据库文件")
    
    db = ColdChainDatabase(use_timescaledb=use_ts)
    
    if force_new or db.is_empty():
        print("初始化数据库，导入示例数据...")
        from data_generator import generate_demo_data
        df_shipments, df_samples, _ = generate_demo_data()
        db.import_data(df_shipments, df_samples)
        print(f"  已导入 {len(df_shipments)} 条运输记录")
        print(f"  已导入 {len(df_samples)} 条温度采样")
    
    return db
