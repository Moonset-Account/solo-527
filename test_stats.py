from sqlalchemy import create_engine, func, case
from sqlalchemy.orm import sessionmaker
from app.models.models import Base, Doctor, Schedule, TimeSlot, Appointment
from datetime import date, time

engine = create_engine("sqlite:///test_verify.db")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
db = Session()

d1 = Doctor(name="Zhang", title="Attending", department="Dental", phone="13800138001")
d2 = Doctor(name="Li", title="Assoc Chief", department="Dental", phone="13800138002")
db.add_all([d1, d2])
db.flush()

today = date.today()
s1 = Schedule(doctor_id=d1.id, schedule_date=today, start_time=time(9,0), end_time=time(12,0), total_slots=5, status="active")
s2 = Schedule(doctor_id=d2.id, schedule_date=today, start_time=time(9,0), end_time=time(12,0), total_slots=5, status="active")
db.add_all([s1, s2])
db.flush()

ts1 = TimeSlot(schedule_id=s1.id, start_time=time(9,0), end_time=time(9,30), is_booked=True)
ts2 = TimeSlot(schedule_id=s1.id, start_time=time(9,30), end_time=time(10,0), is_booked=True)
ts3 = TimeSlot(schedule_id=s1.id, start_time=time(10,0), end_time=time(10,30), is_booked=True)
ts4 = TimeSlot(schedule_id=s2.id, start_time=time(9,0), end_time=time(9,30), is_booked=True)
ts5 = TimeSlot(schedule_id=s2.id, start_time=time(9,30), end_time=time(10,0), is_booked=True)
db.add_all([ts1, ts2, ts3, ts4, ts5])
db.flush()

appointments = [
    Appointment(appointment_no="APT001", patient_name="p1", patient_phone="13900139001", doctor_id=d1.id, schedule_id=s1.id, time_slot_id=ts1.id, source="online", service_type="cleaning", price=199, status="checked_in"),
    Appointment(appointment_no="APT002", patient_name="p2", patient_phone="13900139002", doctor_id=d1.id, schedule_id=s1.id, time_slot_id=ts2.id, source="online", service_type="cleaning", price=199, status="no_show"),
    Appointment(appointment_no="APT003", patient_name="p3", patient_phone="13900139003", doctor_id=d2.id, schedule_id=s2.id, time_slot_id=ts4.id, source="phone", service_type="filling", price=299, status="checked_in"),
    Appointment(appointment_no="APT004", patient_name="p4", patient_phone="13900139004", doctor_id=d2.id, schedule_id=s2.id, time_slot_id=ts5.id, source="direct", service_type="extraction", price=199, status="cancelled"),
    Appointment(appointment_no="APT005", patient_name="p5", patient_phone="13900139005", doctor_id=d1.id, schedule_id=s1.id, time_slot_id=ts3.id, source="phone", service_type="cleaning", price=199, status="pending"),
]
db.add_all(appointments)
db.commit()

print("=== by-source ===")
results = db.query(
    Appointment.source,
    func.count(Appointment.id).label("total"),
    func.sum(case((Appointment.status == "checked_in", 1), else_=0)).label("checked_in"),
    func.sum(case((Appointment.status == "no_show", 1), else_=0)).label("no_show"),
    func.sum(case((Appointment.status == "cancelled", 1), else_=0)).label("cancelled")
).join(
    Schedule, Appointment.schedule_id == Schedule.id
).filter(
    Schedule.schedule_date >= today,
    Schedule.schedule_date <= today
).group_by(Appointment.source).all()

for row in results:
    print(f"  source={row.source} total={row.total} checked_in={row.checked_in} no_show={row.no_show} cancelled={row.cancelled}")

print("=== by-doctor ===")
subquery = db.query(
    Appointment.doctor_id,
    func.count(Appointment.id).label("total"),
    func.sum(case((Appointment.status == "checked_in", 1), else_=0)).label("checked_in"),
    func.sum(case((Appointment.status == "no_show", 1), else_=0)).label("no_show")
).join(
    Schedule, Appointment.schedule_id == Schedule.id
).filter(
    Schedule.schedule_date >= today,
    Schedule.schedule_date <= today
).group_by(Appointment.doctor_id).subquery()

results = db.query(
    Doctor.id.label("doctor_id"),
    Doctor.name.label("doctor_name"),
    func.coalesce(subquery.c.total, 0).label("total"),
    func.coalesce(subquery.c.checked_in, 0).label("checked_in"),
    func.coalesce(subquery.c.no_show, 0).label("no_show")
).outerjoin(
    subquery, Doctor.id == subquery.c.doctor_id
).filter(
    Doctor.is_active == True
).all()

for row in results:
    total = row.total or 0
    ci = row.checked_in or 0
    rate = (ci / total * 100) if total > 0 else 0
    print(f"  doctor={row.doctor_name} total={total} checked_in={ci} rate={rate:.1f}%")

print("=== daily ===")
results = db.query(
    Schedule.schedule_date,
    func.count(Appointment.id).label("total"),
    func.sum(case((Appointment.status == "checked_in", 1), else_=0)).label("checked_in"),
    func.sum(case((Appointment.status == "no_show", 1), else_=0)).label("no_show")
).outerjoin(
    Appointment, Appointment.schedule_id == Schedule.id
).filter(
    Schedule.schedule_date >= today,
    Schedule.schedule_date <= today
).group_by(Schedule.schedule_date).order_by(Schedule.schedule_date).all()

for row in results:
    total = row.total or 0
    ci = row.checked_in or 0
    rate = (ci / total * 100) if total > 0 else 0
    print(f"  date={row.schedule_date} total={total} checked_in={ci} rate={rate:.1f}%")

print("ALL QUERIES PASSED")

db.close()
import os
os.unlink("test_verify.db")
