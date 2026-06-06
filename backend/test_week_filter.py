from app.core.database import SessionLocal
from app.models import EnergyData, Device
from sqlalchemy import func, Integer, between
from datetime import datetime, timedelta

db = SessionLocal()

end_time = datetime.now()
start_time = end_time - timedelta(days=30)

base = db.query(EnergyData, Device).join(Device, EnergyData.device_id == Device.id).filter(
    between(EnergyData.timestamp, start_time, end_time),
    Device.status != "offline"
)
print(f"基础查询: {base.count()} 条")

# 简化筛选，直接用字符串比较
from sqlalchemy import text
exam_query = base.filter(
    text("CAST(strftime('%d', energy_data.timestamp) AS INTEGER) BETWEEN 15 AND 21")
)
print(f"考试周查询: {exam_query.count()} 条")

normal_query = base.filter(
    text("NOT CAST(strftime('%d', energy_data.timestamp) AS INTEGER) BETWEEN 15 AND 21")
)
print(f"普通周查询: {normal_query.count()} 条")

db.close()
