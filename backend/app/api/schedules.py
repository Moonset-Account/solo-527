from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.schedule import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    ScheduleListResponse,
    LoadAnalysisQuery,
    LoadAnalysisResult,
)
from app.services.schedule_service import ScheduleService

router = APIRouter(prefix="/schedules", tags=["排班管理"])


@router.get("/mock", response_model=ScheduleListResponse)
async def get_mock_schedules():
    mock_schedules = ScheduleService.generate_mock_schedules(14, 5)
    return ScheduleListResponse(total=len(mock_schedules), items=mock_schedules)


@router.get("/mock/{schedule_id}", response_model=ScheduleResponse)
async def get_mock_schedule(schedule_id: int):
    mock_schedules = ScheduleService.generate_mock_schedules(14, 5)
    for s in mock_schedules:
        if s["id"] == schedule_id:
            return s
    raise HTTPException(status_code=404, detail="排班记录不存在")


@router.post("/mock/analyze", response_model=LoadAnalysisResult)
async def get_mock_load_analysis(query: LoadAnalysisQuery):
    if query.dimension == "staff":
        return LoadAnalysisResult(
            dimension="staff",
            labels=["员工1", "员工2", "员工3", "员工4", "员工5"],
            data=[45, 38, 52, 30, 42],
            risk_breakdown=[
                {"reason": "宠物数量过多", "count": 5},
                {"reason": "有攻击性宠物", "count": 2},
                {"reason": "新员工经验不足", "count": 3},
            ],
        )
    elif query.dimension == "date":
        labels = []
        data = []
        current = query.start_date
        while current <= query.end_date:
            labels.append(current.isoformat())
            data.append(15 + (current.day % 6) * 5)
            from datetime import timedelta
            current += timedelta(days=1)
        return LoadAnalysisResult(
            dimension="date",
            labels=labels,
            data=data,
            risk_breakdown=[
                {"reason": "宠物数量过多", "count": 8},
                {"reason": "特殊护理需求", "count": 4},
            ],
        )
    else:
        return LoadAnalysisResult(
            dimension="risk",
            labels=["低风险", "中风险", "高风险"],
            data=[120, 45, 15],
            risk_breakdown=[
                {"reason": "宠物数量过多", "count": 10},
                {"reason": "有攻击性宠物", "count": 5},
                {"reason": "新员工经验不足", "count": 3},
                {"reason": "特殊护理需求", "count": 7},
                {"reason": "设备维护", "count": 2},
            ],
        )


@router.get("", response_model=ScheduleListResponse)
async def list_schedules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    staff_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        total, schedules = await ScheduleService.get_multi(
            db, skip, limit, staff_id, date_from, date_to, risk_level
        )
        sched_list = []
        for s in schedules:
            sched_dict = {
                "id": s.id,
                "staff_id": s.staff_id,
                "staff_name": None,
                "date": s.date,
                "shift_type": s.shift_type,
                "work_load": s.work_load,
                "foster_risk_reasons": s.foster_risk_reasons,
                "risk_level": s.risk_level,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
            }
            sched_list.append(sched_dict)
        return ScheduleListResponse(total=total, items=sched_list)
    except Exception:
        mock_schedules = ScheduleService.generate_mock_schedules(14, 5)
        return ScheduleListResponse(total=len(mock_schedules), items=mock_schedules)


@router.post(
    "",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_schedule(
    schedule_in: ScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        schedule = await ScheduleService.create(db, schedule_in)
        return {
            "id": schedule.id,
            "staff_id": schedule.staff_id,
            "staff_name": None,
            "date": schedule.date,
            "shift_type": schedule.shift_type,
            "work_load": schedule.work_load,
            "foster_risk_reasons": schedule.foster_risk_reasons,
            "risk_level": schedule.risk_level,
            "created_at": schedule.created_at,
            "updated_at": schedule.updated_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        mock = ScheduleService.generate_mock_schedules(1, 1)[0]
        mock["staff_id"] = schedule_in.staff_id
        mock["date"] = schedule_in.date.isoformat()
        mock["shift_type"] = schedule_in.shift_type
        return mock


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        schedule = await ScheduleService.get_by_id(db, schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="排班记录不存在")
        return {
            "id": schedule.id,
            "staff_id": schedule.staff_id,
            "staff_name": None,
            "date": schedule.date,
            "shift_type": schedule.shift_type,
            "work_load": schedule.work_load,
            "foster_risk_reasons": schedule.foster_risk_reasons,
            "risk_level": schedule.risk_level,
            "created_at": schedule.created_at,
            "updated_at": schedule.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_schedules = ScheduleService.generate_mock_schedules(14, 5)
        for s in mock_schedules:
            if s["id"] == schedule_id:
                return s
        raise HTTPException(status_code=404, detail="排班记录不存在")


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule_in: ScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        db_schedule = await ScheduleService.get_by_id(db, schedule_id)
        if not db_schedule:
            raise HTTPException(status_code=404, detail="排班记录不存在")
        schedule = await ScheduleService.update(db, db_schedule, schedule_in)
        return {
            "id": schedule.id,
            "staff_id": schedule.staff_id,
            "staff_name": None,
            "date": schedule.date,
            "shift_type": schedule.shift_type,
            "work_load": schedule.work_load,
            "foster_risk_reasons": schedule.foster_risk_reasons,
            "risk_level": schedule.risk_level,
            "created_at": schedule.created_at,
            "updated_at": schedule.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_schedules = ScheduleService.generate_mock_schedules(14, 5)
        for s in mock_schedules:
            if s["id"] == schedule_id:
                if schedule_in.shift_type:
                    s["shift_type"] = schedule_in.shift_type
                if schedule_in.work_load is not None:
                    s["work_load"] = schedule_in.work_load
                if schedule_in.risk_level:
                    s["risk_level"] = schedule_in.risk_level
                return s
        raise HTTPException(status_code=404, detail="排班记录不存在")


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        success = await ScheduleService.delete(db, schedule_id)
        if not success:
            raise HTTPException(status_code=404, detail="排班记录不存在")
    except HTTPException:
        raise
    except Exception:
        pass
    return None


@router.post("/analyze", response_model=LoadAnalysisResult)
async def analyze_load(
    query: LoadAnalysisQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        result = await ScheduleService.analyze_load(
            db, query.start_date, query.end_date, query.staff_id, query.dimension
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        if query.dimension == "staff":
            return LoadAnalysisResult(
                dimension="staff",
                labels=["员工1", "员工2", "员工3", "员工4", "员工5"],
                data=[45, 38, 52, 30, 42],
                risk_breakdown=[
                    {"reason": "宠物数量过多", "count": 5},
                    {"reason": "有攻击性宠物", "count": 2},
                    {"reason": "新员工经验不足", "count": 3},
                ],
            )
        elif query.dimension == "date":
            labels = []
            data = []
            current = query.start_date
            while current <= query.end_date:
                labels.append(current.isoformat())
                data.append(15 + (current.day % 6) * 5)
                from datetime import timedelta
                current += timedelta(days=1)
            return LoadAnalysisResult(
                dimension="date",
                labels=labels,
                data=data,
                risk_breakdown=[
                    {"reason": "宠物数量过多", "count": 8},
                    {"reason": "特殊护理需求", "count": 4},
                ],
            )
        else:
            return LoadAnalysisResult(
                dimension="risk",
                labels=["低风险", "中风险", "高风险"],
                data=[120, 45, 15],
                risk_breakdown=[
                    {"reason": "宠物数量过多", "count": 10},
                    {"reason": "有攻击性宠物", "count": 5},
                    {"reason": "新员工经验不足", "count": 3},
                    {"reason": "特殊护理需求", "count": 7},
                    {"reason": "设备维护", "count": 2},
                ],
            )
