from datetime import datetime
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user_optional, create_access_token
from app import models
from app.config import settings

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")


def _render_with_context(request: Request, user: models.User, template_name: str, extra_context: dict | None = None):
    token = create_access_token(user.id)
    context = {
        "request": request,
        "current_user": user,
        "access_token": token,
        "run_mode": settings.run_mode,
        "now": datetime.now().strftime("%Y年%m月%d日"),
    }
    if extra_context:
        context.update(extra_context)
    return templates.TemplateResponse(template_name, context)


def _auth_or_redirect(request: Request, user: models.User | None):
    if not user:
        resp = RedirectResponse(url="/login", status_code=302)
        resp.delete_cookie(key="access_token")
        return resp
    return None


@router.get("/", response_class=HTMLResponse)
def index(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "dashboard.html")


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "dashboard.html")


@router.get("/harvest", response_class=HTMLResponse)
def harvest_page(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "harvest.html")


@router.get("/batches", response_class=HTMLResponse)
def batches_page(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "batches.html")


@router.get("/alerts", response_class=HTMLResponse)
def alerts_page(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "alerts.html")


@router.get("/sorting", response_class=HTMLResponse)
def sorting_page(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "sorting.html")


@router.get("/subsidy", response_class=HTMLResponse)
def subsidy_page(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "subsidy.html")


@router.get("/reports", response_class=HTMLResponse)
def reports_page(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "reports.html")


@router.get("/notifications", response_class=HTMLResponse)
def notifications_page(
    request: Request,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    redirect = _auth_or_redirect(request, user)
    if redirect:
        return redirect
    return _render_with_context(request, user, "notifications.html")
