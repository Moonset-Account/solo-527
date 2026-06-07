from sqlalchemy import create_engine, Column, String, Integer, DateTime, JSON, Text, Float, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Index
from contextlib import contextmanager
import logging
import os

from config.settings import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


class ReviewLog(Base):
    __tablename__ = "review_logs"

    video_id = Column(String(64), primary_key=True)
    source = Column(String(32), nullable=False, index=True)
    queue_type = Column(String(32), nullable=False, index=True)
    enqueue_time = Column(DateTime, nullable=False, index=True)
    machine_risk_tags = Column(JSON, nullable=False, default=list)
    machine_decision_time = Column(DateTime, nullable=True)
    reviewer_id = Column(String(32), nullable=True, index=True)
    reviewer_start_time = Column(DateTime, nullable=True)
    reviewer_end_time = Column(DateTime, nullable=True)
    reviewer_decision = Column(String(32), nullable=True)
    final_risk_tags = Column(JSON, nullable=True, default=list)
    shift = Column(String(32), nullable=True, index=True)

    __table_args__ = (
        Index("idx_review_logs_time_queue", "enqueue_time", "queue_type"),
        Index("idx_review_logs_reviewer_time", "reviewer_id", "enqueue_time"),
    )


class AppealLog(Base):
    __tablename__ = "appeal_logs"

    appeal_id = Column(String(64), primary_key=True)
    video_id = Column(String(64), nullable=False, index=True)
    appeal_time = Column(DateTime, nullable=False, index=True)
    appeal_reason = Column(Text, nullable=True)
    appeal_decision_time = Column(DateTime, nullable=True)
    appeal_result = Column(String(32), nullable=False)
    appeal_reviewer = Column(String(64), nullable=True)
    original_risk_tags = Column(JSON, nullable=False, default=list)
    source = Column(String(32), nullable=True, index=True)
    shift = Column(String(32), nullable=True, index=True)
    original_reviewer_id = Column(String(32), nullable=True, index=True)
    original_queue_type = Column(String(32), nullable=True, index=True)

    __table_args__ = (
        Index("idx_appeal_logs_time_result", "appeal_time", "appeal_result"),
    )


class ExportTask(Base):
    __tablename__ = "export_tasks"

    task_id = Column(String(64), primary_key=True)
    status = Column(String(32), nullable=False, default="pending")
    progress = Column(Integer, nullable=False, default=0)
    filters = Column(JSON, nullable=False)
    export_type = Column(String(32), nullable=False)
    format = Column(String(16), nullable=False, default="xlsx")
    file_path = Column(String(256), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)


class DatabaseManager:
    _instance = None
    _engine = None
    _SessionLocal = None
    _is_connected = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_engine()
        return cls._instance

    def _init_engine(self):
        try:
            db_url = os.environ.get("TIMESCALEDB_URL", settings.timescaledb_url)
            self._engine = create_engine(
                db_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=False,
                pool_timeout=5,
                connect_args={"connect_timeout": 5},
            )
            with self._engine.connect() as conn:
                conn.execute("SELECT 1")
            self._SessionLocal = sessionmaker(
                autocommit=False, autoflush=False, bind=self._engine
            )
            self._is_connected = True
            logger.info("✅ 数据库连接成功")
        except Exception as e:
            logger.warning(f"⚠️  数据库连接失败，将使用内存数据: {e}")
            self._is_connected = False
            self._engine = None
            self._SessionLocal = None

    @property
    def is_connected(self):
        return self._is_connected

    def get_engine(self):
        return self._engine

    @contextmanager
    def get_session(self):
        if not self._is_connected:
            raise ConnectionError("数据库未连接")
        session = self._SessionLocal()
        try:
            yield session
        finally:
            session.close()

    def create_tables(self):
        if not self._is_connected:
            return False
        try:
            Base.metadata.create_all(bind=self._engine)
            self._create_hypertable()
            logger.info("✅ 数据表创建成功")
            return True
        except Exception as e:
            logger.error(f"❌ 数据表创建失败: {e}")
            return False

    def _create_hypertable(self):
        try:
            with self._engine.connect() as conn:
                result = conn.execute(
                    "SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'"
                )
                has_timescaledb = result.fetchone() is not None
                conn.commit()

                if has_timescaledb:
                    logger.info("🔍 检测到 TimescaleDB 扩展，创建超表...")
                    for table_name, time_col in [
                        ("review_logs", "enqueue_time"),
                        ("appeal_logs", "appeal_time"),
                    ]:
                        try:
                            check_sql = f"""
                                SELECT NOT EXISTS (
                                    SELECT 1 FROM timescaledb_information.hypertables 
                                    WHERE hypertable_name = '{table_name}'
                                ) AS need_create
                            """
                            need_create = conn.execute(check_sql).scalar()
                            if need_create:
                                conn.execute(
                                    f"SELECT create_hypertable('{table_name}', '{time_col}')"
                                )
                                logger.info(f"✅ 超表 {table_name} 创建成功")
                            else:
                                logger.info(f"ℹ️  超表 {table_name} 已存在")
                        except Exception as e:
                            logger.warning(f"⚠️  超表 {table_name} 创建失败: {e}")
                    conn.commit()
                else:
                    logger.info("ℹ️  未检测到 TimescaleDB 扩展，使用普通 PostgreSQL 表")
        except Exception as e:
            logger.info(f"ℹ️  超表创建跳过: {e}")


db_manager = DatabaseManager()
