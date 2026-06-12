from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.change_window import ChangeWindow, WindowStatusEnum
from app.models.user import User, RoleEnum
from app.routers.auth import require_login, require_admin
from datetime import datetime

router = APIRouter(prefix="/change-windows", tags=["变更窗口"])


@router.get("")
async def list_change_windows(
    request: Request,
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    from app.templates import templates

    query = select(ChangeWindow).order_by(ChangeWindow.start_time.desc())
    if status:
        query = query.where(ChangeWindow.status == WindowStatusEnum(status))

    result = await db.execute(query)
    windows = result.scalars().all()

    return templates.TemplateResponse("change_windows/list.html", {
        "request": request,
        "windows": windows,
        "current_user": user,
        "WindowStatusEnum": WindowStatusEnum,
        "RoleEnum": RoleEnum,
    })


@router.post("/create")
async def create_change_window(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    form = await request.form()
    start_time_str = form.get("start_time", "")
    end_time_str = form.get("end_time", "")

    if not start_time_str or not end_time_str:
        return RedirectResponse(url="/change-windows", status_code=303)

    start_time = datetime.fromisoformat(start_time_str)
    end_time = datetime.fromisoformat(end_time_str)

    if end_time <= start_time:
        return RedirectResponse(url="/change-windows", status_code=303)

    window = ChangeWindow(
        title=form.get("title", "").strip(),
        description=form.get("description", "").strip() or None,
        status=WindowStatusEnum(form.get("status", "planned")),
        start_time=start_time,
        end_time=end_time,
        is_risky=form.get("is_risky") == "on",
        responsible_person=form.get("responsible_person", "").strip() or None,
    )
    db.add(window)
    return RedirectResponse(url="/change-windows", status_code=303)


@router.post("/{window_id}/update")
async def update_change_window(
    request: Request,
    window_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    form = await request.form()
    result = await db.execute(select(ChangeWindow).where(ChangeWindow.id == window_id))
    window = result.scalar_one_or_none()
    if not window:
        return Response(status_code=404)

    status_val = form.get("status")
    if status_val:
        window.status = WindowStatusEnum(status_val)

    for field in ["title", "description", "responsible_person"]:
        val = form.get(field)
        if val is not None:
            setattr(window, field, val.strip() or None)

    is_risky = form.get("is_risky")
    if is_risky is not None:
        window.is_risky = is_risky == "on"

    return RedirectResponse(url="/change-windows", status_code=303)
