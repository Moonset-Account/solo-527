from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Request, Depends, Form, status, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..auth import get_current_user, get_current_user_optional, authenticate_user
from ..models import User
from ..redis_client import get_redis, RedisClient
from ..schemas import (
    OrderListFilter, OrderStatus, SatisfactionTraceFilter,
    ExceptionType, ExceptionStatus, UserRole
)
from ..services.order_service import OrderService
from ..services.query_service import QueryService
from ..services.exception_service import ExceptionService
from ..services.trace_service import TraceService
from ..services.admin_service import AdminService

router = APIRouter()

templates = Jinja2Templates(directory=settings.TEMPLATES_DIR)


def get_template_context(request: Request, current_user: Optional[User] = None, **kwargs):
    context = {
        "request": request,
        "current_user": current_user,
        "now": datetime.now(),
        "OrderStatus": OrderStatus,
        "ExceptionType": ExceptionType,
        "ExceptionStatus": ExceptionStatus,
        "UserRole": UserRole,
    }
    context.update(kwargs)
    return context


@router.get("/", response_class=HTMLResponse)
async def root(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if current_user:
        return RedirectResponse(url="/dashboard")
    return RedirectResponse(url="/login")


@router.get("/login", response_class=HTMLResponse)
async def login_page(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if current_user:
        return RedirectResponse(url="/dashboard")
    return templates.TemplateResponse("login.html", get_template_context(request))


@router.post("/login", response_class=HTMLResponse)
async def login(
    request: Request,
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
    redis: RedisClient = Depends(get_redis)
):
    user = authenticate_user(db, username, password)
    if not user:
        return templates.TemplateResponse(
            "login.html",
            get_template_context(request, error="用户名或密码错误")
        )
    
    session_id = redis.set_session(
        user.id,
        {"username": user.username, "role": user.role, "name": user.name}
    )
    
    admin_service = AdminService(db)
    admin_service.update_last_login(user.id)
    
    response = RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(
        key="session_id",
        value=session_id,
        max_age=86400,
        httponly=True,
        samesite="lax"
    )
    return response


@router.post("/logout")
async def logout(
    request: Request,
    redis: RedisClient = Depends(get_redis)
):
    session_id = request.cookies.get("session_id")
    if session_id:
        redis.delete_session(session_id)
    
    response = RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie("session_id")
    return response


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    query_service = QueryService(db)
    exception_service = ExceptionService(db)
    trace_service = TraceService(db)
    
    order_stats = order_service.get_dashboard_stats(current_user)
    invoice_summary = query_service.get_invoice_summary(current_user)
    delivery_summary = query_service.get_delivery_summary(current_user)
    exception_stats = exception_service.get_exception_stats(current_user)
    overall_stats = trace_service.get_overall_stats(current_user)
    
    filter_params = OrderListFilter(page=1, page_size=5)
    recent_orders = order_service.list_orders(filter_params, current_user)
    
    return templates.TemplateResponse(
        "dashboard.html",
        get_template_context(
            request, current_user,
            order_stats=order_stats,
            invoice_summary=invoice_summary,
            delivery_summary=delivery_summary,
            exception_stats=exception_stats,
            overall_stats=overall_stats,
            recent_orders=recent_orders
        )
    )


@router.get("/orders", response_class=HTMLResponse)
async def orders_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    
    filter_params = OrderListFilter(
        status=status,
        page=page,
        page_size=page_size,
        keyword=keyword
    )
    
    if current_user.role == "admin":
        photographers = db.query(User).filter(User.role == "photographer").all()
    else:
        photographers = []
    
    orders_result = order_service.list_orders(filter_params, current_user)
    
    return templates.TemplateResponse(
        "orders/list.html",
        get_template_context(
            request, current_user,
            orders=orders_result,
            filter_params=filter_params,
            photographers=photographers
        )
    )


@router.get("/orders/{order_id}", response_class=HTMLResponse)
async def order_detail_page(
    request: Request,
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    
    order = order_service.get_order(order_id, current_user)
    if not order:
        return RedirectResponse(url="/orders")
    
    photo_selections = order_service.get_photo_selections(order_id, current_user)
    delivery_files = order_service.get_delivery_files(order_id, current_user)
    
    return templates.TemplateResponse(
        "orders/detail.html",
        get_template_context(
            request, current_user,
            order=order,
            photo_selections=photo_selections,
            delivery_files=delivery_files
        )
    )


@router.get("/orders/{order_id}/select", response_class=HTMLResponse)
async def order_select_page(
    request: Request,
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    
    order = order_service.get_order(order_id, current_user)
    if not order:
        return RedirectResponse(url="/orders")
    
    photo_selections = order_service.get_photo_selections(order_id, current_user)
    
    return templates.TemplateResponse(
        "orders/selection.html",
        get_template_context(
            request, current_user,
            order=order,
            photo_selections=photo_selections
        )
    )


@router.get("/orders/{order_id}/download", response_class=HTMLResponse)
async def order_download_page(
    request: Request,
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    
    order = order_service.get_order(order_id, current_user)
    if not order:
        return RedirectResponse(url="/orders")
    
    delivery_files = order_service.get_delivery_files(order_id, current_user)
    
    return templates.TemplateResponse(
        "orders/download.html",
        get_template_context(
            request, current_user,
            order=order,
            delivery_files=delivery_files
        )
    )


@router.get("/query/invoices", response_class=HTMLResponse)
async def invoices_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    query_service = QueryService(db)
    
    invoices = query_service.get_invoices(current_user, page=page, page_size=page_size)
    summary = query_service.get_invoice_summary(current_user)
    
    return templates.TemplateResponse(
        "query/invoices.html",
        get_template_context(
            request, current_user,
            invoices=invoices,
            summary=summary
        )
    )


@router.get("/query/deliveries", response_class=HTMLResponse)
async def deliveries_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    query_service = QueryService(db)
    
    deliveries = query_service.get_deliveries(current_user, page=page, page_size=page_size)
    summary = query_service.get_delivery_summary(current_user)
    
    return templates.TemplateResponse(
        "query/deliveries.html",
        get_template_context(
            request, current_user,
            deliveries=deliveries,
            summary=summary
        )
    )


@router.get("/query/authorizations", response_class=HTMLResponse)
async def authorizations_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    query_service = QueryService(db)
    
    authorizations = query_service.get_authorizations(current_user, page=page, page_size=page_size)
    summary = query_service.get_authorization_summary(current_user)
    
    return templates.TemplateResponse(
        "query/authorizations.html",
        get_template_context(
            request, current_user,
            authorizations=authorizations,
            summary=summary
        )
    )


@router.get("/admin", response_class=HTMLResponse)
async def admin_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    tab: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        return RedirectResponse(url="/dashboard")
    
    admin_service = AdminService(db)
    order_service = OrderService(db)
    
    filter_params = OrderListFilter(page=page, page_size=page_size)
    orders = order_service.list_orders(filter_params, current_user)
    photographers = db.query(User).filter(User.role == "photographer").all()
    
    users = admin_service.list_users(current_user, page=page, page_size=page_size)
    test_accounts = admin_service.get_test_accounts(current_user)
    stats = admin_service.get_test_data_stats(current_user)
    
    return templates.TemplateResponse(
        "admin/index.html",
        get_template_context(
            request, current_user,
            orders=orders,
            photographers=photographers,
            users=users,
            test_accounts=test_accounts,
            test_data_stats=stats,
            active_tab=tab or "orders"
        )
    )


@router.get("/admin/orders", response_class=HTMLResponse)
async def admin_orders_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return RedirectResponse(url="/admin?tab=orders")


@router.get("/admin/users", response_class=HTMLResponse)
async def admin_users_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return RedirectResponse(url="/admin?tab=users")


@router.get("/trace/satisfaction", response_class=HTMLResponse)
async def trace_satisfaction_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trace_service = TraceService(db)
    
    filter_params = SatisfactionTraceFilter(exclude_test_data=True)
    stats = trace_service.get_satisfaction_stats(filter_params, current_user)
    details = trace_service.get_satisfaction_details(filter_params, current_user)
    
    return templates.TemplateResponse(
        "trace/index.html",
        get_template_context(
            request, current_user,
            stats=stats,
            details=details,
            filter_params=filter_params
        )
    )


@router.get("/exceptions", response_class=HTMLResponse)
async def exceptions_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    
    exceptions = exception_service.list_exceptions(
        current_user, page=page, page_size=page_size
    )
    stats = exception_service.get_exception_stats(current_user)
    
    return templates.TemplateResponse(
        "exceptions/list.html",
        get_template_context(
            request, current_user,
            exceptions=exceptions,
            stats=stats
        )
    )


@router.get("/exceptions/{ticket_id}", response_class=HTMLResponse)
async def exception_detail_page(
    request: Request,
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    
    ticket = exception_service.get_exception(ticket_id, current_user)
    if not ticket:
        return RedirectResponse(url="/exceptions")
    
    logs = exception_service.get_exception_logs(ticket_id, current_user)
    stats = exception_service.get_exception_stats(current_user)
    exceptions = exception_service.list_exceptions(current_user)
    
    return templates.TemplateResponse(
        "exceptions/list.html",
        get_template_context(
            request, current_user,
            exceptions=exceptions,
            stats=stats,
            active_ticket=ticket,
            ticket_logs=logs
        )
    )
