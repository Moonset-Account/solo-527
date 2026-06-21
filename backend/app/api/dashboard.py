from typing import Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_active_user
from app.models.user import User
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["仪表板"])


@router.get("/mock")
async def get_mock_dashboard():
    return DashboardService.get_mock_dashboard_data()


@router.get("/mock/todo-stats")
async def get_mock_todo_stats():
    return DashboardService.get_mock_dashboard_data()["todo_stats"]


@router.get("/mock/exception-stats")
async def get_mock_exception_stats():
    return DashboardService.get_mock_dashboard_data()["exception_stats"]


@router.get("/mock/order-trend")
async def get_mock_order_trend():
    return DashboardService.get_mock_dashboard_data()["order_trend"]


@router.get("/mock/overview")
async def get_mock_overview():
    return DashboardService.get_mock_dashboard_data()["overview_stats"]


@router.get("")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    try:
        todo_stats = await DashboardService.get_todo_stats(db)
        exception_stats = await DashboardService.get_exception_stats(db)
        order_trend = await DashboardService.get_order_trend(db, 7)
        service_type_stats = await DashboardService.get_service_type_stats(db)
        overview_stats = await DashboardService.get_overview_stats(db)

        mock_data = DashboardService.get_mock_dashboard_data()

        return {
            "todo_stats": todo_stats,
            "exception_stats": exception_stats,
            "order_trend": order_trend,
            "service_type_stats": service_type_stats,
            "overview_stats": overview_stats,
            "recent_todos": mock_data["recent_todos"],
            "recent_exceptions": mock_data["recent_exceptions"],
        }
    except Exception:
        return DashboardService.get_mock_dashboard_data()


@router.get("/todo-stats")
async def get_todo_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return await DashboardService.get_todo_stats(db)
    except Exception:
        return DashboardService.get_mock_dashboard_data()["todo_stats"]


@router.get("/exception-stats")
async def get_exception_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return await DashboardService.get_exception_stats(db)
    except Exception:
        return DashboardService.get_mock_dashboard_data()["exception_stats"]


@router.get("/order-trend")
async def get_order_trend(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return await DashboardService.get_order_trend(db, days)
    except Exception:
        return DashboardService.get_mock_dashboard_data()["order_trend"]


@router.get("/service-type-stats")
async def get_service_type_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return await DashboardService.get_service_type_stats(db)
    except Exception:
        return DashboardService.get_mock_dashboard_data()["service_type_stats"]


@router.get("/overview")
async def get_overview_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return await DashboardService.get_overview_stats(db)
    except Exception:
        return DashboardService.get_mock_dashboard_data()["overview_stats"]
