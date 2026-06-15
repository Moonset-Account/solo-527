import sys
import os
from datetime import date, timedelta, datetime, time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import (
    Doctor, Schedule, TimeSlot, Appointment,
    PricingRule, SystemConfig, Waitlist
)


def init_db():
    db = SessionLocal()

    try:
        if db.query(Doctor).count() > 0:
            print("数据库已有数据，跳过初始化")
            return

        print("正在初始化数据库...")

        doctors = [
            Doctor(name="张医生", title="主治医师", department="口腔科", phone="13800138001"),
            Doctor(name="李医生", title="副主任医师", department="口腔科", phone="13800138002"),
            Doctor(name="王医生", title="医师", department="口腔科", phone="13800138003"),
        ]
        db.add_all(doctors)
        db.flush()

        today = date.today()
        for i, doctor in enumerate(doctors):
            for day_offset in range(7):
                schedule_date = today + timedelta(days=day_offset)
                if day_offset % 2 == i % 2:
                    schedule = Schedule(
                        doctor_id=doctor.id,
                        schedule_date=schedule_date,
                        start_time=time(9, 0),
                        end_time=time(12, 0),
                        total_slots=5,
                        status="active"
                    )
                    db.add(schedule)
                    db.flush()

                    for j in range(5):
                        start_min = j * 36
                        end_min = (j + 1) * 36
                        slot = TimeSlot(
                            schedule_id=schedule.id,
                            start_time=time(9 + start_min // 60, start_min % 60),
                            end_time=time(9 + end_min // 60, end_min % 60),
                            is_booked=False
                        )
                        db.add(slot)

        pricing_rules = [
            PricingRule(
                name="基础洁牙",
                service_type="洁牙",
                base_price=199,
                discount=0,
                source="all",
                is_active=True,
                description="标准洁牙服务"
            ),
            PricingRule(
                name="线上特惠洁牙",
                service_type="洁牙",
                base_price=199,
                discount=20,
                source="online",
                is_active=True,
                description="线上预约专享8折"
            ),
            PricingRule(
                name="舒适洁牙",
                service_type="洁牙",
                base_price=399,
                discount=0,
                source="all",
                is_active=True,
                description="舒适化洁牙服务"
            ),
            PricingRule(
                name="基础补牙",
                service_type="补牙",
                base_price=299,
                discount=0,
                source="all",
                is_active=True,
                description="树脂补牙"
            ),
            PricingRule(
                name="普通拔牙",
                service_type="拔牙",
                base_price=199,
                discount=0,
                source="all",
                is_active=True,
                description="普通牙齿拔除"
            ),
        ]
        db.add_all(pricing_rules)

        configs = [
            SystemConfig(
                config_key="clinic_name",
                config_value="阳光口腔诊所",
                config_type="string",
                description="诊所名称"
            ),
            SystemConfig(
                config_key="default_slots",
                config_value="5",
                config_type="number",
                description="默认号源数量"
            ),
            SystemConfig(
                config_key="appointment_reminder_hours",
                config_value="24",
                config_type="number",
                description="预约提醒提前小时数"
            ),
            SystemConfig(
                config_key="enable_waitlist",
                config_value="true",
                config_type="boolean",
                description="是否开启候补功能"
            ),
            SystemConfig(
                config_key="max_days_ahead",
                config_value="30",
                config_type="number",
                description="可提前预约天数"
            ),
        ]
        db.add_all(configs)

        db.flush()

        first_schedule = db.query(Schedule).first()
        if first_schedule:
            slots = db.query(TimeSlot).filter(TimeSlot.schedule_id == first_schedule.id).all()
            if len(slots) >= 2:
                import uuid
                appt_no = f"APT{today.strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"
                appointment = Appointment(
                    appointment_no=appt_no,
                    patient_name="测试患者1",
                    patient_phone="13900139001",
                    doctor_id=first_schedule.doctor_id,
                    schedule_id=first_schedule.id,
                    time_slot_id=slots[0].id,
                    source="online",
                    service_type="洁牙",
                    price=159.2,
                    status="pending"
                )
                db.add(appointment)
                slots[0].is_booked = True
                first_schedule.booked_slots += 1

                waitlist = Waitlist(
                    patient_name="候补患者1",
                    patient_phone="13900139002",
                    doctor_id=first_schedule.doctor_id,
                    target_date=first_schedule.schedule_date,
                    source="phone",
                    status="waiting",
                    priority=1
                )
                db.add(waitlist)

        db.commit()
        print("数据库初始化完成！")
        print(f"  - 医生: {len(doctors)} 人")
        print(f"  - 价格规则: {len(pricing_rules)} 条")
        print(f"  - 系统配置: {len(configs)} 项")

    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
