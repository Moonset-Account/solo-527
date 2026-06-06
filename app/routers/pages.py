from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.config import TEMPLATES_DIR, STATUS_NAMES, STATUS_COLORS, ATTACHMENT_TYPE_NAMES, ROLE_NAMES
from app.services.transfer import get_transfer_orders, get_transfer_order, get_batch_map
from app.services.attachment import get_attachments_by_order, get_supplement_records
from app.services.review import get_pending_review_orders
from app.services.finance import get_settlement_orders
from app.services.audit import get_audit_logs, ACTION_NAMES
from app.models import FilterParams
import urllib.parse

router = APIRouter()
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

def get_current_user(request: Request):
    user_id = request.cookies.get("user_id")
    username = request.cookies.get("username")
    role = request.cookies.get("role")
    full_name = request.cookies.get("full_name")
    
    if not user_id or not role:
        return None
    
    if full_name:
        try:
            full_name = urllib.parse.unquote(full_name)
        except:
            pass
    
    return {
        "id": user_id,
        "username": username,
        "role": role,
        "full_name": full_name
    }

def template_context(request: Request, **kwargs):
    user = get_current_user(request)
    ctx = {
        "request": request,
        "current_user": user,
        "STATUS_NAMES": STATUS_NAMES,
        "STATUS_COLORS": STATUS_COLORS,
        "ATTACHMENT_TYPE_NAMES": ATTACHMENT_TYPE_NAMES,
        "ROLE_NAMES": ROLE_NAMES,
        "ACTION_NAMES": ACTION_NAMES,
    }
    ctx.update(kwargs)
    return ctx

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return await transfer_list(request)

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", template_context(request))

@router.get("/transfer", response_class=HTMLResponse)
async def transfer_list(
    request: Request,
    status: str = None,
    batch_no: str = None,
    from_warehouse: str = None,
    to_warehouse: str = None,
    keyword: str = None,
    page: int = 1
):
    user = get_current_user(request)
    if not user:
        from fastapi.responses import RedirectResponse
        return RedirectResponse("/login", status_code=302)
    
    if user["role"] == "FINANCE":
        from fastapi.responses import RedirectResponse
        return RedirectResponse("/finance", status_code=302)
    
    filters = FilterParams(
        status=status,
        batch_no=batch_no,
        from_warehouse=from_warehouse,
        to_warehouse=to_warehouse,
        keyword=keyword
    )
    
    page_size = 20
    offset = (page - 1) * page_size
    
    orders, total = get_transfer_orders(
        filters=filters,
        user_role=user["role"],
        user_id=user["id"],
        limit=page_size,
        offset=offset
    )
    
    batch_map = get_batch_map()
    total_pages = (total + page_size - 1) // page_size
    
    return templates.TemplateResponse("transfer/list.html", template_context(
        request,
        orders=orders,
        total=total,
        page=page,
        total_pages=total_pages,
        filters=filters,
        batch_map=batch_map
    ))

@router.get("/transfer/import", response_class=HTMLResponse)
async def transfer_import_page(request: Request):
    user = get_current_user(request)
    if not user:
        from fastapi.responses import RedirectResponse
        return RedirectResponse("/login", status_code=302)
    
    if user["role"] == "FINANCE":
        from fastapi.responses import RedirectResponse
        return RedirectResponse("/finance", status_code=302)
    
    return templates.TemplateResponse("transfer/import.html", template_context(
        request
    ))

@router.get("/transfer/{order_id}", response_class=HTMLResponse)
async def transfer_detail(request: Request, order_id: str):
    user = get_current_user(request)
    if not user:
        from fastapi.responses import RedirectResponse
        return RedirectResponse("/login", status_code=302)
    
    if user["role"] == "FINANCE":
        raise HTTPException(status_code=403, detail="财务角色无权限访问调拨单详情")
    
    order = get_transfer_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="调拨单不存在")
    
    attachments = get_attachments_by_order(order_id)
    supplement_records = get_supplement_records(order_id)
    audit_logs, _ = get_audit_logs(transfer_order_id=order_id, limit=50)
    
    attachments_by_type = {}
    for att in attachments:
        if att["type"] not in attachments_by_type:
            attachments_by_type[att["type"]] = []
        attachments_by_type[att["type"]].append(att)
    
    return templates.TemplateResponse("transfer/detail.html", template_context(
        request,
        order=order,
        attachments=attachments,
        attachments_by_type=attachments_by_type,
        supplement_records=supplement_records,
        audit_logs=audit_logs
    ))

@router.get("/review", response_class=HTMLResponse)
async def review_dashboard(request: Request, page: int = 1):
    user = get_current_user(request)
    if not user or user["role"] not in ["SUPERVISOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    page_size = 20
    offset = (page - 1) * page_size
    
    pending_orders, total = get_pending_review_orders(limit=page_size, offset=offset)
    total_pages = (total + page_size - 1) // page_size
    
    return templates.TemplateResponse("review/dashboard.html", template_context(
        request,
        pending_orders=pending_orders,
        total=total,
        page=page,
        total_pages=total_pages
    ))

@router.get("/finance", response_class=HTMLResponse)
async def finance_reconciliation(
    request: Request,
    date_from: str = None,
    date_to: str = None,
    keyword: str = None,
    page: int = 1
):
    user = get_current_user(request)
    if not user or user["role"] not in ["FINANCE", "ADMIN"]:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    page_size = 20
    offset = (page - 1) * page_size
    
    orders, total = get_settlement_orders(
        date_from=date_from,
        date_to=date_to,
        keyword=keyword,
        limit=page_size,
        offset=offset
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return templates.TemplateResponse("finance/reconciliation.html", template_context(
        request,
        orders=orders,
        total=total,
        page=page,
        total_pages=total_pages,
        date_from=date_from,
        date_to=date_to,
        keyword=keyword
    ))

@router.get("/audit", response_class=HTMLResponse)
async def audit_logs(
    request: Request,
    operator: str = None,
    action: str = None,
    date_from: str = None,
    date_to: str = None,
    page: int = 1
):
    user = get_current_user(request)
    if not user or user["role"] not in ["SUPERVISOR", "ADMIN", "FINANCE"]:
        raise HTTPException(status_code=403, detail="无权限访问")
    
    page_size = 50
    offset = (page - 1) * page_size
    
    logs, total = get_audit_logs(
        operator=operator,
        action=action,
        date_from=date_from,
        date_to=date_to,
        limit=page_size,
        offset=offset
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return templates.TemplateResponse("audit/logs.html", template_context(
        request,
        logs=logs,
        total=total,
        page=page,
        total_pages=total_pages,
        operator=operator,
        action=action,
        date_from=date_from,
        date_to=date_to
    ))
