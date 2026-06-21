from datetime import datetime, timedelta, date
from typing import Optional, List
from collections import defaultdict
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule import Schedule
from app.models.user import User
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, LoadAnalysisResult, RiskBreakdownItem


class ScheduleService:
    @staticmethod
    async def get_by_id(db: AsyncSession, schedule_id: int) -> Optional[Schedule]:
        result = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_staff_and_date(db: AsyncSession, staff_id: int, schedule_date: date) -> Optional[Schedule]:
        result = await db.execute(
            select(Schedule).where(
                and_(Schedule.staff_id == staff_id, Schedule.date == schedule_date)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, schedule_in: ScheduleCreate) -> Schedule:
        existing = await ScheduleService.get_by_staff_and_date(
            db, schedule_in.staff_id, schedule_in.date
        )
        if existing:
            raise ValueError("该员工当日已有排班记录")
        schedule = Schedule(**schedule_in.model_dump())
        db.add(schedule)
        await db.commit()
        await db.refresh(schedule)
        return schedule

    @staticmethod
    async def update(
        db: AsyncSession, db_schedule: Schedule, schedule_in: ScheduleUpdate
    ) -> Schedule:
        update_data = schedule_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_schedule, field, value)
        await db.commit()
        await db.refresh(db_schedule)
        return db_schedule

    @staticmethod
    async def delete(db: AsyncSession, schedule_id: int) -> bool:
        result = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
        schedule = result.scalar_one_or_none()
        if schedule:
            await db.delete(schedule)
            await db.commit()
            return True
        return False

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        staff_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        risk_level: Optional[str] = None,
    ) -> tuple[int, List[Schedule]]:
        query = select(Schedule)
        if staff_id:
            query = query.where(Schedule.staff_id == staff_id)
        if date_from:
            query = query.where(Schedule.date >= date_from)
        if date_to:
            query = query.where(Schedule.date <= date_to)
        if risk_level:
            query = query.where(Schedule.risk_level == risk_level)

        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        query = query.order_by(Schedule.date.asc(), Schedule.staff_id.asc()).offset(skip).limit(limit)
        result = await db.execute(query)
        schedules = result.scalars().all()
        return total, schedules

    @staticmethod
    async def get_range(
        db: AsyncSession, start_date: date, end_date: date, staff_id: Optional[int] = None
    ) -> List[Schedule]:
        query = select(Schedule).where(
            and_(Schedule.date >= start_date, Schedule.date <= end_date)
        )
        if staff_id:
            query = query.where(Schedule.staff_id == staff_id)
        query = query.order_by(Schedule.date.asc(), Schedule.staff_id.asc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def analyze_load(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        staff_id: Optional[int],
        dimension: str,
    ) -> LoadAnalysisResult:
        schedules = await ScheduleService.get_range(db, start_date, end_date, staff_id)
        labels: List[str] = []
        data: List[int] = []
        risk_breakdown: List[RiskBreakdownItem] = []

        if dimension == "staff":
            load_by_staff = defaultdict(int)
            risk_by_staff = defaultdict(lambda: defaultdict(int))
            for s in schedules:
                load_by_staff[s.staff_id] += s.work_load
                if s.foster_risk_reasons:
                    for reason in s.foster_risk_reasons.split(";"):
                        if reason.strip():
                            risk_by_staff[s.staff_id][reason.strip()] += 1

            sorted_staff = sorted(load_by_staff.keys())
            for sid in sorted_staff:
                labels.append(f"员工{sid}")
                data.append(load_by_staff[sid])

            risk_counts = defaultdict(int)
            for staff_risks in risk_by_staff.values():
                for reason, cnt in staff_risks.items():
                    risk_counts[reason] += cnt
            risk_breakdown = [RiskBreakdownItem(reason=r, count=c) for r, c in sorted(risk_counts.items())]

        elif dimension == "date":
            load_by_date = defaultdict(int)
            risk_by_date = defaultdict(lambda: defaultdict(int))
            for s in schedules:
                load_by_date[s.date.isoformat()] += s.work_load
                if s.foster_risk_reasons:
                    for reason in s.foster_risk_reasons.split(";"):
                        if reason.strip():
                            risk_by_date[s.date.isoformat()][reason.strip()] += 1

            current = start_date
            while current <= end_date:
                date_str = current.isoformat()
                labels.append(date_str)
                data.append(load_by_date.get(date_str, 0))
                current += timedelta(days=1)

            risk_counts = defaultdict(int)
            for date_risks in risk_by_date.values():
                for reason, cnt in date_risks.items():
                    risk_counts[reason] += cnt
            risk_breakdown = [RiskBreakdownItem(reason=r, count=c) for r, c in sorted(risk_counts.items())]

        elif dimension == "risk":
            risk_levels = ["low", "medium", "high"]
            level_labels = {"low": "低风险", "medium": "中风险", "high": "高风险"}
            load_by_risk = defaultdict(int)
            risk_reasons = defaultdict(int)
            for s in schedules:
                load_by_risk[s.risk_level] += s.work_load
                if s.foster_risk_reasons:
                    for reason in s.foster_risk_reasons.split(";"):
                        if reason.strip():
                            risk_reasons[reason.strip()] += 1

            for level in risk_levels:
                labels.append(level_labels[level])
                data.append(load_by_risk.get(level, 0))
            risk_breakdown = [RiskBreakdownItem(reason=r, count=c) for r, c in sorted(risk_reasons.items())]

        else:
            raise ValueError(f"不支持的分析维度: {dimension}")

        return LoadAnalysisResult(
            dimension=dimension,
            labels=labels,
            data=data,
            risk_breakdown=risk_breakdown if risk_breakdown else None,
        )

    @staticmethod
    def generate_mock_schedules(days: int = 14, staff_count: int = 5) -> List[dict]:
        shift_types = ["morning", "afternoon", "full", "off"]
        shift_names = {"morning": "早班", "afternoon": "晚班", "full": "全天", "off": "休息"}
        risk_levels = ["low", "medium", "high"]
        risk_reasons_list = ["宠物数量过多", "有攻击性宠物", "新员工经验不足", "特殊护理需求", "设备维护"]
        now = datetime.now()
        mock_schedules = []
        idx = 1
        for day_offset in range(days):
            schedule_date = date.today() + timedelta(days=day_offset - 7)
            for staff_id in range(1, staff_count + 1):
                shift = shift_types[(day_offset + staff_id) % len(shift_types)]
                if shift == "off":
                    work_load = 0
                    risk_level = "low"
                    reasons = None
                else:
                    work_load = (staff_id + day_offset) % 10 + 1
                    risk_level = risk_levels[(staff_id + day_offset) % len(risk_levels)]
                    if risk_level != "low":
                        num_reasons = 1 if risk_level == "medium" else 2
                        reasons = ";".join(
                            risk_reasons_list[(staff_id + k) % len(risk_reasons_list)]
                            for k in range(num_reasons)
                        )
                    else:
                        reasons = None
                mock_schedules.append({
                    "id": idx,
                    "staff_id": staff_id,
                    "staff_name": f"员工{staff_id}",
                    "date": schedule_date.isoformat(),
                    "shift_type": shift,
                    "work_load": work_load,
                    "foster_risk_reasons": reasons,
                    "risk_level": risk_level,
                    "created_at": (now - timedelta(days=days - day_offset)).isoformat(),
                    "updated_at": (now - timedelta(days=days - day_offset)).isoformat(),
                })
                idx += 1
        return mock_schedules
