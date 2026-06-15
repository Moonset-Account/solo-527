from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth import get_current_user

router = APIRouter(tags=["页面"])

templates = Jinja2Templates(directory="app/templates")


def get_template_context(request: Request, current_user=None):
    return {
        "request": request,
        "current_user": current_user,
        "site_name": "青禾租赁服务台",
        "role_names": {
            "admin": "管理员",
            "consultant": "置业顾问",
            "customer_service": "租客客服",
            "tenant": "租客"
        },
        "status_labels": {
            "vacant": {"text": "空置", "class": "status-vacant"},
            "occupied": {"text": "已租", "class": "status-occupied"},
            "reserved": {"text": "已订", "class": "status-reserved"},
            "maintenance": {"text": "维护中", "class": "status-maintenance"},
            "decorating": {"text": "装修中", "class": "status-decorating"},
            "pending": {"text": "待处理", "class": "status-pending"},
            "confirmed": {"text": "已确认", "class": "status-confirmed"},
            "completed": {"text": "已完成", "class": "status-completed"},
            "cancelled": {"text": "已取消", "class": "status-cancelled"},
            "no_show": {"text": "未到访", "class": "status-no-show"},
            "paid": {"text": "已缴纳", "class": "status-paid"},
            "refunded": {"text": "已退还", "class": "status-refunded"},
            "deducted": {"text": "已扣除", "class": "status-deducted"},
            "partial_refunded": {"text": "部分退还", "class": "status-partial"},
            "processing": {"text": "处理中", "class": "status-processing"},
            "resolved": {"text": "已解决", "class": "status-resolved"},
            "closed": {"text": "已关闭", "class": "status-closed"},
        },
        "risk_levels": {
            "low": {"text": "低", "class": "level-low"},
            "medium": {"text": "中", "class": "level-medium"},
            "high": {"text": "高", "class": "level-high"},
            "critical": {"text": "严重", "class": "level-critical"},
        }
    }


@router.get("/", response_class=HTMLResponse)
async def home(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
        return RedirectResponse(url="/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    ctx = get_template_context(request)
    return templates.TemplateResponse("auth/login.html", ctx)


@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    ctx = get_template_context(request)
    return templates.TemplateResponse("auth/register.html", ctx)


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "dashboard"
    return templates.TemplateResponse("dashboard/index.html", ctx)


@router.get("/apartments", response_class=HTMLResponse)
async def apartments_page(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "apartments"
    return templates.TemplateResponse("apartments/list.html", ctx)


@router.get("/apartments/{apartment_id}", response_class=HTMLResponse)
async def apartment_detail_page(request: Request, apartment_id: int, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "apartments"
    ctx["apartment_id"] = apartment_id
    return templates.TemplateResponse("apartments/detail.html", ctx)


@router.get("/appointments", response_class=HTMLResponse)
async def appointments_page(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "appointments"
    return templates.TemplateResponse("appointments/list.html", ctx)


@router.get("/appointments/{appointment_id}", response_class=HTMLResponse)
async def appointment_detail_page(request: Request, appointment_id: int, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "appointments"
    ctx["appointment_id"] = appointment_id
    return templates.TemplateResponse("appointments/detail.html", ctx)


@router.get("/deposits", response_class=HTMLResponse)
async def deposits_page(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "deposits"
    return templates.TemplateResponse("deposits/list.html", ctx)


@router.get("/risks", response_class=HTMLResponse)
async def risks_page(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "risks"
    return templates.TemplateResponse("risks/list.html", ctx)


@router.get("/admin/dict", response_class=HTMLResponse)
async def admin_dict_page(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    if current_user.role != "admin":
        return RedirectResponse(url="/dashboard")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "admin_dict"
    return templates.TemplateResponse("admin/dict.html", ctx)


@router.get("/admin/config", response_class=HTMLResponse)
async def admin_config_page(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = await get_current_user(request, db)
    except HTTPException:
        return RedirectResponse(url="/login")

    if current_user.role != "admin":
        return RedirectResponse(url="/dashboard")

    ctx = get_template_context(request, current_user)
    ctx["active_menu"] = "admin_config"
    return templates.TemplateResponse("admin/config.html", ctx)
