from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Index, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()


class TemperatureZone(Base):
    __tablename__ = 'temperature_zones'
    
    id = Column(Integer, primary_key=True)
    zone_name = Column(String(50), unique=True, nullable=False)
    zone_code = Column(String(20), unique=True, nullable=False)
    target_temp_min = Column(Float, nullable=False)
    target_temp_max = Column(Float, nullable=False)
    capacity_m3 = Column(Float)
    description = Column(String(200))


class Location(Base):
    __tablename__ = 'locations'
    
    id = Column(Integer, primary_key=True)
    location_code = Column(String(50), unique=True, nullable=False)
    zone_id = Column(Integer, ForeignKey('temperature_zones.id'), nullable=False)
    aisle = Column(String(10))
    rack = Column(String(10))
    level = Column(Integer)
    position = Column(Integer)
    capacity_pallets = Column(Integer, default=1)
    is_available = Column(Boolean, default=True)
    
    zone = relationship('TemperatureZone', backref='locations')


class TemperatureReading(Base):
    __tablename__ = 'temperature_readings'
    
    id = Column(Integer, primary_key=True)
    time = Column(DateTime, nullable=False, default=datetime.utcnow)
    zone_id = Column(Integer, ForeignKey('temperature_zones.id'), nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float)
    sensor_id = Column(String(50))
    
    zone = relationship('TemperatureZone', backref='readings')


class InventoryBatch(Base):
    __tablename__ = 'inventory_batches'
    
    id = Column(Integer, primary_key=True)
    batch_number = Column(String(50), unique=True, nullable=False)
    customer = Column(String(100), nullable=False)
    product_type = Column(String(50), nullable=False)
    product_name = Column(String(200))
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), default='pallet')
    zone_id = Column(Integer, ForeignKey('temperature_zones.id'))
    location_id = Column(Integer, ForeignKey('locations.id'))
    inbound_time = Column(DateTime, nullable=False)
    expected_outbound_time = Column(DateTime)
    actual_outbound_time = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    zone = relationship('TemperatureZone', backref='batches')
    location = relationship('Location', backref='batches')


class InboundRecord(Base):
    __tablename__ = 'inbound_records'
    
    id = Column(Integer, primary_key=True)
    inbound_time = Column(DateTime, nullable=False)
    batch_id = Column(Integer, ForeignKey('inventory_batches.id'), nullable=False)
    zone_id = Column(Integer, ForeignKey('temperature_zones.id'), nullable=False)
    location_id = Column(Integer, ForeignKey('locations.id'))
    quantity = Column(Float, nullable=False)
    temperature_on_arrival = Column(Float)
    operator = Column(String(100))
    is_during_alarm = Column(Boolean, default=False)
    
    batch = relationship('InventoryBatch', backref='inbound_records')
    zone = relationship('TemperatureZone', backref='inbound_records')
    location = relationship('Location', backref='inbound_records')


class OutboundRecord(Base):
    __tablename__ = 'outbound_records'
    
    id = Column(Integer, primary_key=True)
    outbound_time = Column(DateTime, nullable=False)
    batch_id = Column(Integer, ForeignKey('inventory_batches.id'), nullable=False)
    zone_id = Column(Integer, ForeignKey('temperature_zones.id'), nullable=False)
    location_id = Column(Integer, ForeignKey('locations.id'))
    quantity = Column(Float, nullable=False)
    temperature_on_departure = Column(Float)
    operator = Column(String(100))
    
    batch = relationship('InventoryBatch', backref='outbound_records')
    zone = relationship('TemperatureZone', backref='outbound_records')
    location = relationship('Location', backref='outbound_records')


class DoorEvent(Base):
    __tablename__ = 'door_events'
    
    id = Column(Integer, primary_key=True)
    event_time = Column(DateTime, nullable=False)
    zone_id = Column(Integer, ForeignKey('temperature_zones.id'), nullable=False)
    door_id = Column(String(50), nullable=False)
    event_type = Column(String(20), nullable=False)
    duration_seconds = Column(Integer)
    operator = Column(String(100))
    
    zone = relationship('TemperatureZone', backref='door_events')


class Alarm(Base):
    __tablename__ = 'alarms'
    
    id = Column(Integer, primary_key=True)
    alarm_start = Column(DateTime, nullable=False)
    alarm_end = Column(DateTime)
    zone_id = Column(Integer, ForeignKey('temperature_zones.id'), nullable=False)
    alarm_type = Column(String(50), nullable=False)
    severity = Column(String(20), default='warning')
    description = Column(String(500))
    max_temperature = Column(Float)
    min_temperature = Column(Float)
    is_acknowledged = Column(Boolean, default=False)
    
    zone = relationship('TemperatureZone', backref='alarms')


class ManualNote(Base):
    __tablename__ = 'manual_notes'
    
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    related_type = Column(String(50), nullable=False)
    related_id = Column(Integer, nullable=False)
    note = Column(Text, nullable=False)
    author = Column(String(100))
    is_anomaly = Column(Boolean, default=False)
    
    __table_args__ = (
        Index('idx_related', 'related_type', 'related_id'),
    )


def get_db_url():
    return os.getenv('DATABASE_URL', 'sqlite:///cold_storage.db')


def is_timescaledb_enabled():
    return os.getenv('TIMESCALEDB_ENABLED', 'false').lower() == 'true'


def init_db(db_url=None):
    if db_url is None:
        db_url = get_db_url()
    engine = create_engine(db_url)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session(), engine


def init_timescaledb(db_url=None):
    if db_url is None:
        db_url = get_db_url()
    
    if 'sqlite' in db_url:
        print("警告：SQLite 不支持 TimescaleDB，自动回退到普通 SQLite 模式")
        return init_db(db_url)
    
    engine = create_engine(db_url)
    Base.metadata.create_all(engine)
    
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))
            conn.execute(text("SELECT create_hypertable('temperature_readings', 'time', if_not_exists => TRUE);"))
            conn.execute(text("SELECT create_hypertable('door_events', 'event_time', if_not_exists => TRUE);"))
            conn.execute(text("SELECT create_hypertable('alarms', 'alarm_start', if_not_exists => TRUE);"))
            conn.execute(text("SELECT create_hypertable('inbound_records', 'inbound_time', if_not_exists => TRUE);"))
            conn.execute(text("SELECT create_hypertable('outbound_records', 'outbound_time', if_not_exists => TRUE);"))
            conn.commit()
        print("TimescaleDB 超表创建成功")
    except Exception as e:
        print(f"TimescaleDB 初始化警告（使用普通 PostgreSQL 模式）: {e}")
    
    Session = sessionmaker(bind=engine)
    return Session(), engine
