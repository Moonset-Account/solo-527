from datetime import datetime
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user, oauth2_scheme
from app import models
from app.config import settings

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")


def _check_auth(request: Request, token: str | None, db: Session):
    if not token:
        return None
    from app.security import decode_token
    user_id = decode_token(token)
    if not user_id:
        return None
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        return None
    return user


def _render_with_context(request: Request, user: models.User, template_name: str, extra_context: dict | None = None):
    context = {
        "request": request,
        "current_user": user,
        "run_mode": settings.run_mode,
        "now": datetime.now().strftime("%Y年%m月%d日"),
    }
    if extra_context:
        context.update(extra_context)
    return templates.TemplateResponse(template_name, context)


@router.get("/", response_class=HTMLResponse)
def index(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "dashboard.html")


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "dashboard.html")


@router.get("/harvest", response_class=HTMLResponse)
def harvest_page(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "harvest.html")


@router.get("/batches", response_class=HTMLResponse)
def batches_page(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "batches.html")


@router.get("/alerts", response_class=HTMLResponse)
def alerts_page(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "alerts.html")


@router.get("/sorting", response_class=HTMLResponse)
def sorting_page(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "sorting.html")


@router.get("/subsidy", response_class=HTMLResponse)
def subsidy_page(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "subsidy.html")


@router.get("/reports", response_class=HTMLResponse)
def reports_page(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "reports.html")


@router.get("/notifications", response_class=HTMLResponse)
def notifications_page(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = _check_auth(request, token, db)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return _render_with_context(request, user, "notifications.html")
