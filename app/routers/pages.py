from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.security import get_current_user, require_role
from app.utils.file_handler import format_file_size
from app.services.purchase_service import PurchaseService
from app.services.supplier_service import SupplierService
from app.services.price_service import PriceService
from app.services.approval_service import ApprovalService
from app.services.notification_service import NotificationService
from app.services.delivery_service import DeliveryService
from app.services.admin_service import AdminService
from typing import Optional

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")
templates.env.filters["format_file_size"] = format_file_size
templates.env.globals["formatFileSize"] = format_file_size


@router.get("/", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import PurchaseRequest
    from sqlalchemy import desc
    
    stats = AdminService.get_dashboard_stats(db)
    notifications = NotificationService.get_user_notifications(
        db, current_user.id, page=1, page_size=5
    )[0]
    
    query = db.query(PurchaseRequest)
    if current_user.role == "buyer":
        query = query.filter(PurchaseRequest.created_by == current_user.id)
    recent_purchases = query.order_by(desc(PurchaseRequest.created_at)).limit(5).all()
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "current_user": current_user,
        "stats": stats,
        "notifications": notifications,
        "recent_purchases": recent_purchases
    })


@router.get("/purchase", response_class=HTMLResponse)
async def purchase_list(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchases, total = PurchaseService.get_purchase_list(
        db, user=current_user, status=status,
        keyword=search, page=page, page_size=page_size
    )
    return templates.TemplateResponse("purchase/list.html", {
        "request": request,
        "current_user": current_user,
        "purchases": purchases,
        "total": total,
        "page": page,
        "page_size": page_size,
        "status": status,
        "search": search
    })


@router.get("/purchase/create", response_class=HTMLResponse)
async def purchase_create(
    request: Request,
    current_user: User = Depends(require_role(["buyer", "manager", "admin"]))
):
    return templates.TemplateResponse("purchase/create.html", {
        "request": request,
        "current_user": current_user
    })


@router.get("/purchase/{purchase_id}", response_class=HTMLResponse)
async def purchase_detail(
    request: Request,
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import Attachment, Note, ApprovalRecord
    from app.services import ApprovalService
    from app.utils.file_handler import format_file_size
    
    purchase = PurchaseService.get_purchase_detail(db, purchase_id, current_user)
    
    attachments = db.query(Attachment).filter(
        Attachment.related_id == purchase_id,
        Attachment.related_type == "purchase"
    ).order_by(Attachment.uploaded_at.desc()).all()
    
    notes = db.query(Note).filter(
        Note.related_id == purchase_id,
        Note.related_type == "purchase"
    ).order_by(Note.created_at.desc()).all()
    
    for note in notes:
        note.creator_name = note.creator.real_name if note.creator else None
    
    approval_records = ApprovalService.get_approval_history(db, purchase_id)
    for record in approval_records:
        record.approver_name = record.approver.real_name if record.approver else None
        record.level_name = record.level.name if record.level else None
    
    return templates.TemplateResponse("purchase/detail.html", {
        "request": request,
        "current_user": current_user,
        "purchase": purchase,
        "attachments": attachments,
        "notes": notes,
        "approval_records": approval_records,
        "supplier_name": purchase.supplier.name if purchase.supplier else None,
        "creator_name": purchase.creator.real_name if purchase.creator else None,
        "format_file_size": format_file_size
    })


@router.get("/supplier", response_class=HTMLResponse)
async def supplier_list(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suppliers, total = SupplierService.get_supplier_list(
        db, page=page, page_size=page_size, status=status, search=search
    )
    return templates.TemplateResponse("supplier/list.html", {
        "request": request,
        "current_user": current_user,
        "suppliers": suppliers,
        "total": total,
        "page": page,
        "page_size": page_size,
        "status": status,
        "search": search
    })


@router.get("/supplier/create", response_class=HTMLResponse)
async def supplier_create(
    request: Request,
    current_user: User = Depends(require_role(["auditor", "manager", "admin"]))
):
    return templates.TemplateResponse("supplier/create.html", {
        "request": request,
        "current_user": current_user
    })


@router.get("/supplier/{supplier_id}", response_class=HTMLResponse)
async def supplier_detail(
    request: Request,
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = SupplierService.get_supplier_detail(db, supplier_id)
    return templates.TemplateResponse("supplier/detail.html", {
        "request": request,
        "current_user": current_user,
        "supplier": supplier
    })


@router.get("/approval", response_class=HTMLResponse)
async def approval_list(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "manager", "admin"]))
):
    approvals, total = ApprovalService.get_pending_approvals(
        db, current_user.id, page=page, page_size=page_size
    )
    return templates.TemplateResponse("approval/list.html", {
        "request": request,
        "current_user": current_user,
        "approvals": approvals,
        "total": total,
        "page": page,
        "page_size": page_size
    })


@router.get("/approval/config", response_class=HTMLResponse)
async def approval_config(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    levels = ApprovalService.get_approval_levels(db)
    return templates.TemplateResponse("approval/config.html", {
        "request": request,
        "current_user": current_user,
        "levels": levels
    })


@router.get("/price", response_class=HTMLResponse)
async def price_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = PriceService.get_price_stats(db)
    materials = PriceService.get_material_list(db)
    expiring_prices = PriceService.get_expiring_prices(db, days=30)
    return templates.TemplateResponse("price/dashboard.html", {
        "request": request,
        "current_user": current_user,
        "stats": stats,
        "materials": materials,
        "expiring_prices": expiring_prices
    })


@router.get("/delivery", response_class=HTMLResponse)
async def delivery_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = DeliveryService.get_delivery_stats(db)
    deliveries, _ = DeliveryService.get_delivery_list(db, page=1, page_size=20)
    return templates.TemplateResponse("delivery/dashboard.html", {
        "request": request,
        "current_user": current_user,
        "stats": stats,
        "deliveries": deliveries
    })


@router.get("/notifications", response_class=HTMLResponse)
async def notifications(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications, total = NotificationService.get_user_notifications(
        db, current_user.id, page=page, page_size=page_size
    )
    unread_count = NotificationService.get_unread_count(db, current_user.id)
    return templates.TemplateResponse("notification/list.html", {
        "request": request,
        "current_user": current_user,
        "notifications": notifications,
        "total": total,
        "page": page,
        "page_size": page_size,
        "unread_count": unread_count
    })


@router.get("/admin/invoice-status", response_class=HTMLResponse)
async def admin_invoice_status(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    invoice_statuses = AdminService.get_invoice_status_list(db)
    return templates.TemplateResponse("admin/invoice_status.html", {
        "request": request,
        "current_user": current_user,
        "invoice_statuses": invoice_statuses
    })


@router.get("/admin/spec-attachments", response_class=HTMLResponse)
async def admin_spec_attachments(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    spec_attachments = AdminService.get_spec_attachment_list(db)
    return templates.TemplateResponse("admin/spec_attachments.html", {
        "request": request,
        "current_user": current_user,
        "spec_attachments": spec_attachments
    })


@router.get("/admin/users", response_class=HTMLResponse)
async def admin_users(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    users, _ = AdminService.get_user_list(db)
    return templates.TemplateResponse("admin/users.html", {
        "request": request,
        "current_user": current_user,
        "users": users
    })


@router.get("/approval/{purchase_id}/approve", response_class=HTMLResponse)
async def approval_approve_modal(
    request: Request,
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "manager", "admin"]))
):
    purchase = PurchaseService.get_purchase_detail(db, purchase_id, current_user)
    return templates.TemplateResponse("approval/_approve_modal.html", {
        "request": request,
        "purchase": purchase
    })


@router.get("/approval/{purchase_id}/reject", response_class=HTMLResponse)
async def approval_reject_modal(
    request: Request,
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "manager", "admin"]))
):
    purchase = PurchaseService.get_purchase_detail(db, purchase_id, current_user)
    return templates.TemplateResponse("approval/_reject_modal.html", {
        "request": request,
        "purchase": purchase
    })


@router.get("/approval/{purchase_id}/history", response_class=HTMLResponse)
async def approval_history_modal(
    request: Request,
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchase = PurchaseService.get_purchase_detail(db, purchase_id, current_user)
    history = ApprovalService.get_approval_history(db, purchase_id)
    return templates.TemplateResponse("approval/_history_modal.html", {
        "request": request,
        "purchase": purchase,
        "history": history
    })


@router.get("/approval/levels/create", response_class=HTMLResponse)
async def approval_level_create_modal(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    users, _ = AdminService.get_user_list(db)
    return templates.TemplateResponse("approval/_level_form_modal.html", {
        "request": request,
        "level": None,
        "users": users,
        "level_approver_ids": []
    })


@router.get("/approval/levels/{level_id}/edit", response_class=HTMLResponse)
async def approval_level_edit_modal(
    request: Request,
    level_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    levels = ApprovalService.get_approval_levels(db, include_inactive=True)
    level = next((l for l in levels if l.id == level_id), None)
    users, _ = AdminService.get_user_list(db)
    approvers = ApprovalService.get_level_approvers(db, level_id)
    level_approver_ids = [u.id for u in approvers]
    return templates.TemplateResponse("approval/_level_form_modal.html", {
        "request": request,
        "level": level,
        "users": users,
        "level_approver_ids": level_approver_ids
    })
