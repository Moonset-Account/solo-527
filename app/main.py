from __future__ import annotations

import io
import json
import uuid
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from decimal import Decimal as D
from pathlib import Path
from typing import Any, Optional
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Cookie,
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    Request,
    Response,
    status,
)
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import ValidationError
from sqlalchemy import func, select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app import models
from app.core.config import settings
from app.core.security import hash_password  # noqa: F401
from app.db.redis_cache import RedisCache, get_cache
from app.db.session import (
    Base,
    get_db_session,
    get_engine,
    get_session_factory,
)
from app.schemas import *  # noqa: F401,F403
from app.schemas import (
    AnomalyResolveIn,
    AuditLogOut,
    BillCreateIn,
    BillListFilter,
    BillOut,
    BillUpdateIn,
    ClientBillCard,
    ClientPayPreview,
    ExportCreateIn,
    InvoiceCreateIn,
    InvoiceStatus,
    InvoiceUpdateIn,
    MessageOut,
    NoteCreateIn,
    NoteOut,
    PaginatedOut,
    PaginationIn,
    PrepaidAccountOut,
    PrepaidTxnOut,
    SessionUser,
    TransactionImportResult,
    UserLoginIn,
    UserOut,
    UserRegisterIn,
    format_currency,
)
from app.services import (
    AnomalyService,
    AuthService,
    BillService,
    TransactionService,
)
from app.services.extras import (
    DashboardService,
    ExportService,
    InvoiceService,
    MockDataService,
    PrepaidService,
)


# ============= 基础依赖 =============
def _json_default(obj):
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if isinstance(obj, Decimal):
        return float(obj)
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _json_default(v) if hasattr(v, '__class__') and v.__class__.__name__ not in ('str','int','float','bool','list','dict','NoneType') else v for k, v in obj.items()}
    if isinstance(obj, (bytes, bytearray)):
        try:
            return obj.decode('utf-8')
        except Exception:
            return str(obj)
    try:
        return str(obj)
    except Exception:
        return f"<{obj.__class__.__name__}>"

def _tojson_filter(obj):
    import json
    return json.dumps(obj, default=_json_default, ensure_ascii=False)

templates = Jinja2Templates(directory=str(settings.templates_dir))
templates.env.filters["money"] = format_currency
templates.env.filters["float"] = lambda x: float(x) if x is not None else 0.0
templates.env.filters["tojson"] = _tojson_filter
templates.env.globals["APP_NAME"] = settings.app_name
templates.env.globals["current_year"] = datetime.now().year
templates.env.globals["abs"] = abs
templates.env.globals["D"] = D


def _fake_request() -> Request:
    from starlette.requests import Request as _R
    scope = {
        "type": "http",
        "method": "GET",
        "path": "",
        "headers": [],
        "query_string": b"",
        "server": None,
    }
    return _R(scope)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
) -> SessionUser:
    sid = request.cookies.get(settings.session_cookie_name)
    if not sid:
        raise HTTPException(status_code=303, detail="未登录", headers={"Location": "/auth/login"})
    auth_svc = AuthService(db, cache)
    user = await auth_svc.get_session_user(sid)
    if not user:
        resp = RedirectResponse(url="/auth/login", status_code=303)
        resp.delete_cookie(settings.session_cookie_name)
        raise HTTPException(status_code=303, detail="登录过期") from None
    return user


def require_admin(user: SessionUser = Depends(get_current_user)) -> SessionUser:
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


def require_client(user: SessionUser = Depends(get_current_user)) -> SessionUser:
    if user.role != "CLIENT":
        raise HTTPException(status_code=403, detail="需要客户权限")
    return user


def get_client_ip(request: Optional[Request] = None) -> str:
    if not request:
        return ""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""


async def _extend_pg_enums(engine):
    """扩展PostgreSQL枚举类型，添加缺失的枚举值"""
    from sqlalchemy import text
    enum_defs = {
        "invoice_status": ["REJECTED", "SENT"],
        "anomaly_status": ["IN_PROGRESS", "CLOSED"],
        "anomaly_type": ["AMOUNT_MISMATCH", "OVERDUE", "OVERDUE_LIMIT", "FORECAST_WARN"],
        "txn_match_status": ["PARTIAL_MATCHED", "FULLY_MATCHED", "MANUAL_MATCHED", "CONFLICT"],
        "export_type": ["CASH_FLOW", "AUDIT_CHANGES", "BILL_DETAIL", "RECONCILIATION"],
        "export_status": ["DONE"],
    }
    try:
        for enum_name, values in enum_defs.items():
            for val in values:
                try:
                    async with engine.connect() as conn:
                        await conn.execute(text(f"ALTER TYPE {enum_name} ADD VALUE IF NOT EXISTS '{val}'"))
                        await conn.commit()
                except Exception:
                    pass
        print("[数据库] 枚举类型已扩展")
    except Exception as e:
        print(f"[数据库] 枚举扩展跳过: {type(e).__name__}")

# ============= 应用生命周期 =============
@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_cache().initialize()
    engine = get_engine()
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[数据库] 表结构已同步")
        await _extend_pg_enums(engine)
    except Exception as e:
        print(f"[数据库] 建表跳过（{type(e).__name__}）: 如未启动PostgreSQL可忽略，页面仍可访问")
    # 正确使用 session_factory 而非 async generator
    session_factory = get_session_factory()
    db = session_factory()
    try:
        auth_svc = AuthService(db, get_cache())
        admin_res = await auth_svc.init_default_admin()
        print(f"[管理员] {admin_res.message}")
        mock_svc = MockDataService(db)
        mock_res = await mock_svc.seed_all()
        print(f"[Mock数据] {mock_res.message}")
        system_user = SessionUser(
            id=UUID(int=0), email="system@qinghe.ar",
            name="system", role="ADMIN",
        )
        bill_svc = BillService(db, get_cache(), system_user, "system")
        n = await bill_svc.refresh_days_overdue()
        if n:
            print(f"[逾期刷新] 处理了 {n} 条逾期账单")
        await db.commit()
    except Exception as e:
        print(f"[初始化] {type(e).__name__}: {e}")
        try:
            await db.rollback()
        except Exception:
            pass
    finally:
        await db.close()
    yield
    await get_cache().close()
    await get_engine().dispose()


# ============= FastAPI 实例 =============
app = FastAPI(title=settings.app_name, lifespan=lifespan, debug=settings.debug)
app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

auth_router = APIRouter(prefix="/auth", tags=["认证"])
admin_router = APIRouter(prefix="/admin", tags=["管理端"])
client_router = APIRouter(prefix="/client", tags=["客户端"])


# ============== 上下文辅助 ==============
async def _get_stats_counts(db: AsyncSession) -> dict[str, Any]:
    """获取所有列表页顶部的 counts/overview 卡片数据"""
    counts: dict[str, Any] = {"invoice": {}, "txn": {}, "anomaly": {}, "prepaid": {}, "export": {}}
    # 发票统计
    for st in ["PENDING", "APPROVED", "REJECTED", "ISSUED", "MAILED", "SENT", "ERROR"]:
        c = (await db.execute(select(func.count(models.Invoice.id)).where(models.Invoice.status == st))).scalar_one() or 0
        counts["invoice"][st] = int(c)
    # 流水统计
    for st in ["UNMATCHED", "PARTIAL", "MATCHED", "ANOMALY", "CONFLICT"]:
        c = (await db.execute(select(func.count(models.BankTransaction.id)).where(models.BankTransaction.match_status == st))).scalar_one() or 0
        counts["txn"][st] = int(c)
    counts["txn"]["total"] = int((await db.execute(select(func.count(models.BankTransaction.id)))).scalar_one() or 0)
    amt = (await db.execute(select(func.coalesce(func.sum(models.BankTransaction.amount), 0)))).scalar_one() or 0
    counts["txn"]["total_amount"] = D(str(amt))
    # 异常统计
    for st in ["OPEN", "IN_PROGRESS", "RESOLVED", "IGNORED", "CLOSED"]:
        c = (await db.execute(select(func.count(models.Anomaly.id)).where(models.Anomaly.status == st))).scalar_one() or 0
        counts["anomaly"][st] = int(c)
    # 预存统计
    total_bal = (await db.execute(select(func.coalesce(func.sum(models.PrepaidAccount.current_balance), 0)))).scalar_one() or 0
    counts["prepaid"]["total_balance"] = D(str(total_bal))
    counts["prepaid"]["accounts_count"] = int((await db.execute(select(func.count(models.PrepaidAccount.id)))).scalar_one() or 0)
    # 导出统计
    for st in ["PENDING", "PROCESSING", "DONE", "FAILED"]:
        c = (await db.execute(select(func.count(models.ExportTask.id)).where(models.ExportTask.status == st))).scalar_one() or 0
        counts["export"][st] = int(c)
    return counts


# ============= 认证路由 =============
@auth_router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(
        request, "auth/login.html",
        {"error": None, "next": request.query_params.get("next", "")},
    )


@auth_router.post("/login")
async def login_action(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    next_url: str = Form(default=""),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    try:
        login_data = UserLoginIn(email=email, password=password)
    except ValidationError:
        return templates.TemplateResponse(
            request, "auth/login.html",
            {"error": "请检查邮箱与密码格式", "next": next_url},
        )
    try:
        auth_svc = AuthService(db, cache)
        user, sid = await auth_svc.login(login_data)
    except Exception as e:
        return templates.TemplateResponse(
            request, "auth/login.html",
            {"error": f"系统错误：{type(e).__name__}（请确认PostgreSQL已启动且数据库已创建）", "next": next_url},
        )
    if not user or not sid:
        return templates.TemplateResponse(
            request, "auth/login.html",
            {"error": "邮箱或密码错误", "next": next_url},
        )
    target = next_url or ("/admin/dashboard" if user.role == "ADMIN" else "/client/bills")
    resp = RedirectResponse(url=target, status_code=303)
    resp.set_cookie(
        settings.session_cookie_name, sid,
        max_age=settings.session_ttl_seconds, httponly=True,
        samesite="lax", secure=settings.is_production,
    )
    return resp


@auth_router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse(request, "auth/register.html", {"error": None})


@auth_router.post("/register")
async def register_action(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    company_name: str = Form(default=""),
):
    try:
        data = UserRegisterIn(
            email=email, password=password, name=name,
            company_name=company_name or None,
        )
    except ValidationError:
        return templates.TemplateResponse(
            request, "auth/register.html", {"error": "请检查字段格式"},
        )
    try:
        auth_svc = AuthService(db, cache)
        await auth_svc.register_client(data)
    except Exception as e:
        return templates.TemplateResponse(
            request, "auth/register.html", {"error": f"注册失败: {e}"},
        )
    return RedirectResponse(url="/auth/login", status_code=303)


@auth_router.post("/logout")
async def logout(
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
    sid: Optional[str] = Cookie(default=None, alias=settings.session_cookie_name),
):
    if sid:
        await AuthService(db, cache).logout(sid)
    resp = RedirectResponse(url="/auth/login", status_code=303)
    resp.delete_cookie(settings.session_cookie_name)
    return resp


# ============= 根路径 =============
@app.get("/", response_class=HTMLResponse)
async def root_redirect(
    request: Request,
    user: SessionUser = Depends(get_current_user),
):
    return RedirectResponse(
        url="/admin/dashboard" if user.role == "ADMIN" else "/client/bills",
        status_code=303,
    )


# ============= 管理端路由 =============
@admin_router.get("/dashboard", response_class=HTMLResponse)
async def admin_dashboard(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    stats = await DashboardService(db, cache).get_stats()
    counts = await _get_stats_counts(db)
    return templates.TemplateResponse(
        request, "admin/dashboard.html",
        {"user": user, "s": stats, "stats": stats, "counts": counts, "active_nav": "dashboard"},
    )


@admin_router.get("/dashboard/api/stats")
async def dashboard_stats_api(
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    return await DashboardService(db, cache).get_stats()


# ---- 账单 ----
@admin_router.get("/bills", response_class=HTMLResponse)
async def admin_bills_page(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    clients = (await db.execute(select(models.Client).order_by(models.Client.name))).scalars().all()
    counts = await _get_stats_counts(db)
    return templates.TemplateResponse(
        request, "admin/bills.html",
        {"user": user, "clients": clients, "counts": counts, "active_nav": "bills"},
    )


@admin_router.get("/bills/api/list")
async def admin_bills_list(
    request: Request,
    page: int = 1, page_size: int = 20,
    keyword: str = "", status: str = "", client_id: str = "",
    invoice_requested: str = "", only_overdue: str = "",
    sort_by: str = "due_date", sort_desc: str = "1",
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    f = BillListFilter(
        keyword=keyword or None,
        status=[s for s in status.split(",") if s] if status else None,
        client_id=UUID(client_id) if client_id else None,
        invoice_requested=(invoice_requested == "1") if invoice_requested else None,
        only_overdue=(only_overdue == "1"),
        sort_by=sort_by,  # type: ignore
        sort_desc=(sort_desc == "1"),
    )
    p = PaginationIn(page=page, page_size=page_size)
    svc = BillService(db, cache, user, "api")
    result: PaginatedOut[BillOut] = await svc.list(p, f)
    return templates.TemplateResponse(
        request=request, name="partials/bill_rows.html",
        context={"data": result, "user": user},
    )


@admin_router.get("/bills/{bill_id}", response_class=HTMLResponse)
async def admin_bill_detail(
    request: Request,
    bill_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    svc = BillService(db, cache, user, get_client_ip(request))
    bill = await svc.get(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="账单不存在")
    notes = await svc.get_notes(bill_id)
    audits = await svc.get_audit_logs(bill_id)
    atts = (await db.execute(
        select(models.Attachment)
        .where(models.Attachment.bill_id == bill_id)
        .order_by(desc(models.Attachment.uploaded_at))
    )).scalars().all()
    payments_raw = (await db.execute(
        select(models.Payment, models.BankTransaction.txn_no)
        .outerjoin(models.BankTransaction, models.Payment.transaction_id == models.BankTransaction.id)
        .where(models.Payment.bill_id == bill_id)
        .order_by(desc(models.Payment.matched_at))
    )).all()
    payments = [{"pay": p, "txn_no": tn or "—"} for p, tn in payments_raw]
    # 概览数据
    total_paid = sum(p["pay"].amount for p in payments)
    remaining = max(bill.total_amount - total_paid, D("0"))
    overview = {
        "total_paid": D(total_paid),
        "remaining": D(remaining),
        "payments_count": len(payments),
        "attachments_count": len(atts),
        "notes_count": len(notes),
        "audits_count": len(audits),
    }
    return templates.TemplateResponse(
        request, "admin/bill_detail.html",
        {
            "user": user, "bill": bill, "notes": notes, "audits": audits,
            "attachments": atts, "payments": payments, "overview": overview,
            "active_nav": "bills",
        },
    )


@admin_router.post("/bills/{bill_id}/notes")
async def admin_bill_add_note(
    request: Request,
    bill_id: UUID,
    content: str = Form(...),
    is_internal: bool = Form(default=True),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    svc = BillService(db, cache, user, None)  # type: ignore
    note = await svc.add_note(bill_id, NoteCreateIn(content=content, is_internal=is_internal))
    return templates.TemplateResponse(
        request=request, name="partials/note_item.html", context={"note": note},
    )


@admin_router.post("/bills/{bill_id}/edit")
async def admin_bill_edit(
    bill_id: UUID,
    period_start: date = Form(...),
    period_end: date = Form(...),
    issue_date: date = Form(...),
    due_date: date = Form(...),
    total_amount: Decimal = Form(...),
    status: BillStatus = Form(...),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    svc = BillService(db, cache, user, "")
    try:
        data = BillUpdateIn(
            period_start=period_start, period_end=period_end,
            issue_date=issue_date, due_date=due_date,
            total_amount=total_amount, status=status,
            change_reason="管理端手动编辑",
        )
        updated = await svc.update(bill_id, data)
        if not updated:
            return MessageOut(message="账单不存在", code=404)
        return MessageOut(message="账单已更新")
    except Exception as e:
        return MessageOut(message=f"保存失败: {str(e)}", code=500)


@admin_router.post("/bills/{bill_id}/payment")
async def admin_payment_add(
    bill_id: UUID,
    amount: Decimal = Form(...),
    method: str = Form(default="BANK_TRANSFER"),
    paid_at: Optional[date] = Form(None),
    transaction_id: Optional[UUID] = Form(None),
    remark: Optional[str] = Form(default=None),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    if amount <= 0:
        return MessageOut(message="回款金额必须大于0", code=400)
    bill = (await db.execute(
        select(models.Bill).where(models.Bill.id == bill_id)
    )).scalar_one_or_none()
    if not bill:
        return MessageOut(message="账单不存在", code=404)
    remaining = D(bill.total_amount) - D(bill.paid_amount)
    if amount > remaining + D("0.01"):
        return MessageOut(message=f"回款金额({amount})超过剩余应收({remaining})", code=400)
    paid_at_dt = datetime.combine(paid_at or date.today(), datetime.min.time(), tzinfo=datetime.now().astimezone().tzinfo)
    payment = models.Payment(
        bill_id=bill_id,
        transaction_id=transaction_id,
        amount=amount,
        match_type="MANUAL",
        matched_by=user.id,
        remark=remark,
        matched_at=paid_at_dt,
    )
    db.add(payment)
    bill.paid_amount = D(bill.paid_amount) + amount
    new_remaining = D(bill.total_amount) - bill.paid_amount
    if new_remaining <= D("0.01"):
        bill.status = "PAID"
    elif bill.paid_amount > 0 and bill.status in ("DRAFT", "ISSUED", "OVERDUE"):
        bill.status = "PARTIAL"
    bill.updated_at = datetime.now(tz=bill.updated_at.tzinfo if bill.updated_at.tzinfo else None)
    await db.commit()
    return MessageOut(message=f"已登记回款 ¥{float(amount):,.2f}")


@admin_router.post("/bills/{bill_id}/attachments")
async def admin_attachment_upload(
    bill_id: UUID,
    file_type: str = Form(default="OTHER"),
    file: UploadFile = File(...),
    description: Optional[str] = Form(default=None),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    bill = (await db.execute(
        select(models.Bill).where(models.Bill.id == bill_id)
    )).scalar_one_or_none()
    if not bill:
        return MessageOut(message="账单不存在", code=404)
    MAX_SIZE = 20 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        return MessageOut(message="文件大小超过 20MB 限制", code=400)
    if len(content) == 0:
        return MessageOut(message="文件内容为空", code=400)
    import uuid as _uuid
    import os, base64
    store_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data", "attachments")
    os.makedirs(store_dir, exist_ok=True)
    safe_name = f"{_uuid.uuid4().hex}_{file.filename or 'file'}"
    full_path = os.path.join(store_dir, safe_name)
    try:
        with open(full_path, "wb") as f:
            f.write(content)
    except Exception as e:
        return MessageOut(message=f"保存文件失败: {str(e)}", code=500)
    att = models.Attachment(
        bill_id=bill_id,
        file_type=file_type,
        filename=safe_name,
        original_name=file.filename or "uploaded_file",
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        description=description,
        uploader_id=user.id,
    )
    db.add(att)
    await db.commit()
    return MessageOut(message=f"附件已上传: {file.filename or 'file'}")


@admin_router.get("/bills/{bill_id}/edit-dialog", response_class=HTMLResponse)
async def admin_bill_edit_dialog(
    request: Request,
    bill_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    svc = BillService(db, cache, user, get_client_ip(request))
    bill = await svc.get(bill_id)
    if not bill:
        raise HTTPException(status_code=404)
    return templates.TemplateResponse(
        request, "partials/dialog_bill_edit.html", {"bill": bill},
    )


@admin_router.get("/bills/{bill_id}/payment-dialog", response_class=HTMLResponse)
async def admin_payment_add_dialog(
    request: Request,
    bill_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    bill = (await db.execute(
        select(models.Bill).where(models.Bill.id == bill_id)
    )).scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404)
    remaining = D(bill.total_amount) - D(bill.paid_amount)
    return templates.TemplateResponse(
        request, "partials/dialog_payment_add.html",
        {"bill": bill, "remaining": remaining},
    )


@admin_router.get("/bills/{bill_id}/attachment-dialog", response_class=HTMLResponse)
async def admin_attachment_upload_dialog(
    request: Request,
    bill_id: UUID,
    user: SessionUser = Depends(require_admin),
):
    return templates.TemplateResponse(
        request, "partials/dialog_attachment_upload.html", {"bill_id": bill_id},
    )


@admin_router.get("/attachments/{att_id}/download")
async def admin_attachment_download(
    att_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    att = (await db.execute(
        select(models.Attachment).where(models.Attachment.id == att_id)
    )).scalar_one_or_none()
    if not att:
        raise HTTPException(status_code=404)
    path = Path(settings.upload_path) / att.file_path
    if not path.exists():
        raise HTTPException(status_code=404, detail="文件已丢失")
    return FileResponse(
        path, filename=att.file_name,
        media_type=att.mime_type or "application/octet-stream",
    )


# ---- 流水 ----
@admin_router.get("/transactions", response_class=HTMLResponse)
async def admin_transactions_page(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    counts = await _get_stats_counts(db)
    stats = {
        "unmatched": counts["txn"].get("UNMATCHED", 0),
        "partial": counts["txn"].get("PARTIAL", 0),
        "matched": counts["txn"].get("MATCHED", 0),
        "anomaly": counts["txn"].get("ANOMALY", 0) + counts["txn"].get("CONFLICT", 0),
        "total": counts["txn"].get("total", 0),
    }
    return templates.TemplateResponse(
        request, "admin/transactions.html",
        {"user": user, "counts": counts, "stats": stats, "current_status": "", "active_nav": "transactions"},
    )


@admin_router.get("/transactions/api/list")
async def admin_transactions_list(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    status: str = "",
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    p = PaginationIn(page=page, page_size=page_size)
    svc = TransactionService(db, user, get_client_ip(request))
    status_val = status or None
    data = await svc.list(p, status_val)  # type: ignore
    return templates.TemplateResponse(
        request=request, name="partials/txn_rows.html",
        context={"data": data, "user": user},
    )


@admin_router.post("/transactions/import")
async def admin_transactions_import(
    file: UploadFile = File(...),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        return MessageOut(message="仅支持 CSV 文件", code=400)
    batch = f"BATCH{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
    content = (await file.read()).decode("utf-8", errors="ignore")
    svc = TransactionService(db, user, get_client_ip(None))  # type: ignore
    result: TransactionImportResult = await svc.import_csv(content, batch)
    return result


@admin_router.post("/transactions/auto-match")
async def admin_transactions_auto_match(
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    cache_ = get_cache()
    lock_ok = await cache_.acquire_lock("lock:auto_match", 600)
    if not lock_ok:
        return MessageOut(message="匹配任务正在运行中", code=429)
    try:
        n = await TransactionService(db, user, "").run_auto_match()
        return MessageOut(message=f"智能匹配完成，共匹配 {n} 条")
    finally:
        await cache_.release_lock("lock:auto_match")


@admin_router.post("/transactions/{txn_id}/match")
async def admin_txn_match(
    txn_id: UUID,
    bill_id: UUID = Form(...),
    amount: Optional[float] = Form(None),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    txn = (await db.execute(
        select(models.BankTransaction).where(models.BankTransaction.id == txn_id)
    )).scalar_one_or_none()
    if not txn:
        return MessageOut(message="流水不存在", code=404)
    use_amount = D(str(amount)) if amount else D(txn.amount)
    return await TransactionService(db, user, "").manual_match(txn_id, bill_id, use_amount)


@admin_router.get("/transactions/{txn_id}/match-dialog", response_class=HTMLResponse)
async def admin_txn_match_dialog(
    request: Request,
    txn_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    txn = (await db.execute(
        select(models.BankTransaction).where(models.BankTransaction.id == txn_id)
    )).scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404)
    bills = (await db.execute(
        select(models.Bill, models.Client.name)
        .join(models.Client, models.Client.id == models.Bill.client_id)
        .where(and_(
            models.Bill.status.notin_(["PAID", "VOID"]),
            (models.Bill.total_amount - models.Bill.paid_amount) > 0,
        ))
        .order_by(desc(models.Bill.due_date))
        .limit(50)
    )).all()
    return templates.TemplateResponse(
        request, "partials/dialog_txn_match.html",
        {"txn": txn, "bills": [{"bill": b, "client_name": n} for b, n in bills]},
    )


@admin_router.get("/transactions/{txn_id}", response_class=HTMLResponse)
async def admin_txn_detail(
    request: Request,
    txn_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    txn = (await db.execute(
        select(models.BankTransaction)
        .options(selectinload(models.BankTransaction.payments).selectinload(models.Payment.bill))
        .where(models.BankTransaction.id == txn_id)
    )).scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404)
    return templates.TemplateResponse(
        request, "admin/txn_detail.html",
        {"user": user, "txn": txn, "active_nav": "transactions"},
    )


# ---- 发票 ----
@admin_router.get("/invoices", response_class=HTMLResponse)
async def admin_invoices_page(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    counts = await _get_stats_counts(db)
    issued_amt = (await db.execute(
        select(func.coalesce(func.sum(models.Invoice.amount), 0))
        .where(models.Invoice.status.in_(["ISSUED", "MAILED", "SENT"]))
    )).scalar_one() or 0
    kpi = {
        "pending": counts["invoice"].get("PENDING", 0),
        "approved": counts["invoice"].get("APPROVED", 0),
        "issued": counts["invoice"].get("ISSUED", 0) + counts["invoice"].get("MAILED", 0) + counts["invoice"].get("SENT", 0),
        "issued_amount": D(str(issued_amt)),
        "error": counts["invoice"].get("ERROR", 0),
    }
    return templates.TemplateResponse(
        request, "admin/invoices.html",
        {"user": user, "counts": counts, "kpi": kpi, "current_status": "", "active_nav": "invoices"},
    )


@admin_router.get("/invoices/api/list")
async def admin_invoices_list(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    status: str = "",
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    p = PaginationIn(page=page, page_size=page_size)
    try:
        stmt = select(models.Invoice).options(
            selectinload(models.Invoice.bill),
            selectinload(models.Invoice.client),
        )
        if status:
            stmt = stmt.where(models.Invoice.status == status)
        stmt = stmt.order_by(desc(models.Invoice.applied_at))
        total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
        stmt = stmt.offset(p.offset).limit(p.limit)
        rows = (await db.execute(stmt)).scalars().all()
        outs: list = []
        for r in rows:
            try:
                o = InvoiceOut.model_validate(r, from_attributes=True)
            except Exception:
                o = InvoiceOut(
                    id=r.id,
                    invoice_no=r.invoice_no,
                    bill_id=r.bill_id,
                    bill_no=r.bill.bill_no if r.bill else None,
                    client_id=r.client_id,
                    title=r.title,
                    tax_id=r.tax_id,
                    address=r.address,
                    phone=r.phone,
                    bank_name=r.bank_name,
                    bank_account=r.bank_account,
                    amount=r.amount,
                    type=r.type,
                    status=r.status,
                    validation_errors=[],
                    applied_at=r.applied_at,
                    issued_at=r.issued_at,
                    mailed_at=r.mailed_at,
                )
            if r.bill and not o.bill_no:
                o.bill_no = r.bill.bill_no
            v = r.validation_errors
            parsed = []
            if isinstance(v, dict) and isinstance(v.get("errors"), list):
                for e in v["errors"]:
                    try:
                        parsed.append(InvoiceError.model_validate(e))
                    except Exception:
                        pass
            o.validation_errors = parsed
            outs.append(o)
        from math import ceil
        total_pages = max(1, ceil(total / p.page_size))
        data = PaginatedOut(
            items=outs,
            total=total,
            page=p.page,
            page_size=p.page_size,
            total_pages=total_pages,
            has_next=p.page < total_pages,
            has_prev=p.page > 1,
        )
    except Exception as _e:
        try:
            data = await InvoiceService(db, user, get_client_ip(request)).list(p, status or None)  # type: ignore
        except Exception as _e2:
            raise HTTPException(status_code=500, detail=f"查询失败: {_e}, {_e2}")
    return templates.TemplateResponse(
        request=request, name="partials/invoice_rows.html",
        context={"data": data, "user": user},
    )


@admin_router.post("/invoices/{invoice_id}/approve")
async def admin_invoice_approve(
    invoice_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    inv = await InvoiceService(db, user, get_client_ip(None)).update_status(invoice_id, "APPROVED")  # type: ignore
    if not inv:
        raise HTTPException(status_code=404)
    return MessageOut(message="已审核通过")


@admin_router.post("/invoices/{invoice_id}/reject")
async def admin_invoice_reject(
    invoice_id: UUID,
    reason: str = Form(default="信息有误"),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    inv = await InvoiceService(db, user, get_client_ip(None)).update_status(invoice_id, "REJECTED")  # type: ignore
    if not inv:
        raise HTTPException(status_code=404)
    return MessageOut(message=f"已驳回：{reason}")


@admin_router.post("/invoices/{invoice_id}/issue")
async def admin_invoice_issue(
    invoice_id: UUID,
    invoice_number: str = Form(default=""),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    inv = await InvoiceService(db, user, get_client_ip(None)).update_status(invoice_id, "ISSUED")  # type: ignore
    if not inv:
        raise HTTPException(status_code=404)
    return MessageOut(message="已标记为已开具")


@admin_router.post("/invoices/{invoice_id}/mail")
async def admin_invoice_mail(
    invoice_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    inv = await InvoiceService(db, user, get_client_ip(None)).update_status(invoice_id, "SENT")  # type: ignore
    if not inv:
        raise HTTPException(status_code=404)
    return MessageOut(message="已标记为已寄送")


@admin_router.get("/invoices/{invoice_id}", response_class=HTMLResponse)
async def admin_invoice_detail(
    request: Request,
    invoice_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    inv = (await db.execute(
        select(models.Invoice)
        .options(selectinload(models.Invoice.bill).selectinload(models.Bill.client))
        .where(models.Invoice.id == invoice_id)
    )).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404)
    return templates.TemplateResponse(
        request, "admin/invoice_detail.html",
        {"user": user, "invoice": inv, "active_nav": "invoices"},
    )


# ---- 预存 ----
@admin_router.get("/prepaid", response_class=HTMLResponse)
async def admin_prepaid_page(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    counts = await _get_stats_counts(db)
    # 概览
    total_recharged = (await db.execute(
        select(func.coalesce(func.sum(models.PrepaidTransaction.amount), 0))
        .where(models.PrepaidTransaction.type == "RECHARGE")
    )).scalar_one() or 0
    total_deducted = (await db.execute(
        select(func.coalesce(func.sum(models.PrepaidTransaction.amount), 0))
        .where(models.PrepaidTransaction.type == "DEDUCT")
    )).scalar_one() or 0
    overview = {
        "total_recharged": D(str(total_recharged)),
        "total_deducted": D(str(total_deducted)),
        "net": D(str(total_recharged)) - D(str(total_deducted)),
    }
    return templates.TemplateResponse(
        request, "admin/prepaid.html",
        {"user": user, "counts": counts, "overview": overview, "active_nav": "prepaid"},
    )


@admin_router.get("/prepaid/api/list")
async def admin_prepaid_list(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    p = PaginationIn(page=page, page_size=page_size)
    data: PaginatedOut[PrepaidAccountOut] = await PrepaidService(
        db, user, get_client_ip(request)  # type: ignore
    ).list_accounts(p)
    return templates.TemplateResponse(
        request=request, name="partials/prepaid_rows.html",
        context={"data": data, "user": user},
    )


@admin_router.get("/prepaid/{account_id}/recharge-dialog", response_class=HTMLResponse)
async def admin_prepaid_recharge_dialog(
    request: Request,
    account_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    acc = (await db.execute(
        select(models.PrepaidAccount, models.Client.name)
        .join(models.Client, models.Client.id == models.PrepaidAccount.client_id)
        .where(models.PrepaidAccount.id == account_id)
    )).one_or_none()
    if not acc:
        raise HTTPException(status_code=404)
    account, cname = acc
    return templates.TemplateResponse(
        request, "partials/dialog_prepaid_recharge.html",
        {"account": account, "client_name": cname, "client_company": cname},
    )


@admin_router.post("/prepaid/{account_id}/recharge")
async def admin_prepaid_recharge(
    account_id: UUID,
    amount: Decimal = Form(...),
    method: str = Form(default="BANK_TRANSFER"),
    recharged_at: Optional[date] = Form(None),
    remark: Optional[str] = Form(default=None),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    if amount <= 0:
        return MessageOut(message="充值金额必须大于0", code=400)
    acc = (await db.execute(
        select(models.PrepaidAccount).where(models.PrepaidAccount.id == account_id)
    )).scalar_one_or_none()
    if not acc:
        return MessageOut(message="预存账户不存在", code=404)
    try:
        svc = PrepaidService(db, user, "")
        out = await svc.recharge(acc.client_id, amount, remark or "管理端充值")
        return MessageOut(message=f"预存充值成功 ¥{float(amount):,.2f}，当前余额 ¥{float(out.current_balance):,.2f}")
    except Exception as e:
        return MessageOut(message=f"充值失败: {str(e)}", code=500)


@admin_router.get("/prepaid/{account_id}", response_class=HTMLResponse)
async def admin_prepaid_detail(
    request: Request,
    account_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    acc = (await db.execute(
        select(models.PrepaidAccount)
        .options(
            selectinload(models.PrepaidAccount.client),
            selectinload(models.PrepaidAccount.transactions),
        )
        .where(models.PrepaidAccount.id == account_id)
    )).scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404)
    txns = sorted(acc.transactions, key=lambda t: t.created_at, reverse=True) if acc.transactions else []
    return templates.TemplateResponse(
        request, "admin/prepaid_detail.html",
        {"user": user, "account": acc, "transactions": txns, "active_nav": "prepaid"},
    )


# ---- 异常 ----
@admin_router.get("/anomalies", response_class=HTMLResponse)
async def admin_anomalies_page(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    counts = await _get_stats_counts(db)
    # 按类型统计
    type_counts = {}
    for t, in (await db.execute(
        select(models.Anomaly.type).where(models.Anomaly.status == "OPEN")
    )).all():
        type_counts[str(t)] = type_counts.get(str(t), 0) + 1
    total_open = counts["anomaly"].get("OPEN", 0)
    total_resolved = counts["anomaly"].get("RESOLVED", 0)
    total = total_open + total_resolved + counts["anomaly"].get("IN_PROGRESS", 0)
    resolve_rate = f"{round(total_resolved / max(total, 1) * 100, 1)}%"
    stats = {
        "open": total_open,
        "processing": counts["anomaly"].get("IN_PROGRESS", 0) + counts["anomaly"].get("PROCESSING", 0),
        "resolved": total_resolved,
        "resolve_rate": resolve_rate,
        "total": total,
        "txn_unmatched": type_counts.get("TXN_UNMATCHED", 0),
        "invoice_error": type_counts.get("INVOICE_ERROR", 0),
        "overdue": type_counts.get("OVERDUE_LIMIT", 0) + type_counts.get("OVERDUE", 0),
        "amount_diff": type_counts.get("AMOUNT_DIFF", 0) + type_counts.get("AMOUNT_MISMATCH", 0),
    }
    return templates.TemplateResponse(
        request, "admin/anomalies.html",
        {"user": user, "counts": counts, "stats": stats, "current_type": "", "active_nav": "anomalies"},
    )


@admin_router.get("/anomalies/api/list")
async def admin_anomalies_list(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    type_filter: str = "",
    status_filter: str = "",
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    p = PaginationIn(page=page, page_size=page_size)
    svc = AnomalyService(db, user)
    tf = type_filter or None
    sf = status_filter or None
    data = await svc.list(p, tf, sf)  # type: ignore
    return templates.TemplateResponse(
        request=request, name="partials/anomaly_rows.html",
        context={"data": data, "user": user},
    )


@admin_router.post("/anomalies/{anomaly_id}/resolve")
async def admin_anomaly_resolve(
    anomaly_id: UUID,
    action: Optional[str] = Form(default=None),
    resolution_note: Optional[str] = Form(default=None),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    try:
        data = AnomalyResolveIn(
            status="RESOLVED",
            resolved_note=resolution_note or "管理端手动处理",
        )
        anom = await AnomalyService(db, user).resolve(anomaly_id, data)
        if not anom:
            return MessageOut(message="异常不存在", code=404)
        return MessageOut(message="异常已处理")
    except Exception as e:
        return MessageOut(message=f"处理失败: {str(e)}", code=500)


@admin_router.get("/anomalies/{anomaly_id}/resolve-dialog", response_class=HTMLResponse)
async def admin_anomaly_resolve_dialog(
    request: Request,
    anomaly_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    anom = (await db.execute(
        select(models.Anomaly).where(models.Anomaly.id == anomaly_id)
    )).scalar_one_or_none()
    if not anom:
        raise HTTPException(status_code=404)
    return templates.TemplateResponse(
        request, "partials/dialog_anomaly_resolve.html", {"anomaly": anom},
    )


@admin_router.post("/anomalies/{anomaly_id}/ignore")
async def admin_anomaly_ignore(
    anomaly_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    anom = (await db.execute(
        select(models.Anomaly).where(models.Anomaly.id == anomaly_id)
    )).scalar_one_or_none()
    if not anom:
        raise HTTPException(status_code=404)
    anom.status = "IGNORED"  # type: ignore
    anom.resolved_at = datetime.utcnow()
    anom.resolved_by_id = user.id
    anom.resolution_note = "已忽略"
    db.add(anom)
    await db.commit()
    return MessageOut(message="已忽略此异常")


@admin_router.get("/anomalies/{anomaly_id}", response_class=HTMLResponse)
async def admin_anomaly_detail(
    request: Request,
    anomaly_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    anom = (await db.execute(
        select(models.Anomaly)
        .where(models.Anomaly.id == anomaly_id)
    )).scalar_one_or_none()
    if not anom:
        raise HTTPException(status_code=404)
    related_bill = None
    if anom.related_entity_type == "BILL" and anom.related_entity_id:
        related_bill = (await db.execute(
            select(models.Bill).options(selectinload(models.Bill.client))
            .where(models.Bill.id == anom.related_entity_id)
        )).scalar_one_or_none()
    return templates.TemplateResponse(
        request, "admin/anomaly_detail.html",
        {"user": user, "anomaly": anom, "related_bill": related_bill, "active_nav": "anomalies"},
    )


# ---- 导出 ----
@admin_router.get("/exports", response_class=HTMLResponse)
async def admin_exports_page(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    counts = await _get_stats_counts(db)
    return templates.TemplateResponse(
        request, "admin/exports.html",
        {"user": user, "counts": counts, "active_nav": "exports"},
    )


@admin_router.get("/exports/api/list")
async def admin_exports_list(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    p = PaginationIn(page=page, page_size=page_size)
    data = await ExportService(db, cache, user).list_tasks(p)
    return templates.TemplateResponse(
        request=request, name="partials/export_rows.html",
        context={"data": data, "user": user},
    )


@admin_router.post("/exports")
async def admin_export_create(
    request: Request,
    bg: BackgroundTasks,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    # 支持 Form 提交和 HTMX hx-vals JSON 提交
    body = await request.body()
    params: dict[str, Any] = {"days": 30}
    type_: str = "CASHFLOW"
    if request.headers.get("Content-Type", "").startswith("application/json") and body:
        try:
            j = json.loads(body)
            type_ = str(j.get("type", type_))
            pj = j.get("parameters", {})
            if isinstance(pj, dict):
                params.update(pj)
        except Exception:
            pass
    else:
        form = await request.form()
        type_ = str(form.get("type", type_))
        d = form.get("days")
        if d is not None:
            params["days"] = int(str(d))
    # 兼容多种导出类型命名
    type_map = {
        "CASH_FLOW": "CASHFLOW",
        "AUDIT_CHANGES": "CHANGE_LOG",
        "RECONCILIATION": "CASHFLOW",
    }
    type_final = type_map.get(type_, type_)
    try:
        create_in = ExportCreateIn(type=type_final, parameters=params)  # type: ignore
    except ValidationError as e:
        return MessageOut(message=f"参数错误: {e.errors()[0]['msg']}", code=400)
    svc = ExportService(db, cache, user)
    task = await svc.create_task(create_in)

    async def _execute_background():
        session_factory = get_session_factory()
        s = session_factory()
        try:
            await ExportService(s, cache, user).execute_task(task.id)
            await s.commit()
        except Exception as e:
            print(f"[导出失败] task={task.id} err={e}")
            try:
                await s.rollback()
                await ExportService(s, cache, user)._mark_failed(task.id, str(e))
                await s.commit()
            except Exception:
                pass
        finally:
            await s.close()

    bg.add_task(_execute_background)
    if request.headers.get("HX-Request"):
        return HTMLResponse(
            '<div class="badge badge-green-solid" style="padding:6px 14px">✅ 导出任务已创建，后台执行中...</div>'
        )
    return task


@admin_router.get("/exports/{task_id}/download")
async def admin_export_download(
    task_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    path = await ExportService(db, cache, user).get_download_path(task_id)
    if not path:
        raise HTTPException(status_code=404, detail="文件不存在或未完成")
    return FileResponse(
        path, filename=path.name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@admin_router.post("/exports/{task_id}/retry")
async def admin_export_retry(
    task_id: UUID,
    bg: BackgroundTasks,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    svc = ExportService(db, cache, user)
    task = await svc.retry_task(task_id)
    if not task:
        raise HTTPException(status_code=404)

    async def _bg():
        session_factory = get_session_factory()
        s = session_factory()
        try:
            await ExportService(s, cache, user).execute_task(task.id)
            await s.commit()
        except Exception as e:
            try:
                await s.rollback()
                await ExportService(s, cache, user)._mark_failed(task.id, str(e))
                await s.commit()
            except Exception:
                pass
        finally:
            await s.close()

    bg.add_task(_bg)
    return MessageOut(message="已重新开始导出")


# ============= 客户端路由 =============
@client_router.get("/bills", response_class=HTMLResponse)
async def client_bills_page(
    request: Request,
    status: str = "ALL",
    page: int = 1,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    assert user.client_id
    p = PaginationIn(page=page, page_size=10)
    svc = BillService(db, cache, user, get_client_ip(request))
    data: PaginatedOut[ClientBillCard] = await svc.list_client_bills(user.client_id, p, status)
    prepaid = await PrepaidService(db, user, get_client_ip(request)).get_client_account(user.client_id)  # type: ignore
    # counts
    status_counts = {}
    for st in ["DRAFT", "ISSUED", "PARTIAL", "PAID", "OVERDUE"]:
        c = (await db.execute(select(func.count(models.Bill.id)).where(and_(
            models.Bill.client_id == user.client_id,
            models.Bill.status == st,
        )))).scalar_one() or 0
        status_counts[st] = int(c)
    status_counts["ALL"] = sum(status_counts.values())
    status_counts["UNPAID"] = status_counts.get("ISSUED", 0) + status_counts.get("DRAFT", 0)
    unpaid_count = status_counts["UNPAID"]

    return templates.TemplateResponse(
        request, "client/bills.html",
        {
            "user": user, "data": data, "status_filter": status,
            "prepaid": prepaid, "counts": status_counts, "unpaid_count": unpaid_count,
            "active_nav": "bills",
        },
    )


@client_router.get("/bills/{bill_id}", response_class=HTMLResponse)
async def client_bill_detail(
    request: Request,
    bill_id: UUID,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    assert user.client_id
    bill = await BillService(db, cache, user, get_client_ip(request)).get(bill_id)
    if not bill or bill.client_id != user.client_id:
        raise HTTPException(status_code=404)
    prepaid = await PrepaidService(db, user, get_client_ip(request)).get_client_account(user.client_id)  # type: ignore
    remaining = D(bill.total_amount) - D(bill.paid_amount)
    use_prepaid = prepaid is not None and prepaid.current_balance > 0
    deduct = min(prepaid.current_balance if prepaid else D("0"), remaining)
    actual = max(remaining - (deduct if use_prepaid else D("0")), D("0"))
    preview = ClientPayPreview(
        bill_id=bill.id, bill_no=bill.bill_no, remaining_amount=remaining,
        use_prepaid=use_prepaid, prepaid_deduct=deduct, actual_pay=actual,
        prepaid_balance=prepaid.current_balance if prepaid else D("0"),
    )
    # 支付记录
    payments_raw = (await db.execute(
        select(models.Payment, models.BankTransaction.txn_no)
        .outerjoin(models.BankTransaction, models.Payment.transaction_id == models.BankTransaction.id)
        .where(models.Payment.bill_id == bill_id)
        .order_by(desc(models.Payment.matched_at))
    )).all()
    payments = [{"pay": p, "txn_no": tn or "—"} for p, tn in payments_raw]
    unpaid_count = (await db.execute(select(func.count(models.Bill.id)).where(and_(
        models.Bill.client_id == user.client_id,
        models.Bill.status.in_(["ISSUED", "PARTIAL", "OVERDUE"]),
    )))).scalar_one() or 0

    return templates.TemplateResponse(
        request, "client/bill_detail.html",
        {
            "user": user, "bill": bill, "prepaid": prepaid,
            "preview": preview, "payments": payments, "unpaid_count": unpaid_count,
            "active_nav": "bills",
        },
    )


@client_router.post("/bills/{bill_id}/pay/prepaid")
async def client_bill_pay_prepaid(
    bill_id: UUID,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    bill = await BillService(db, get_cache(), user, get_client_ip(None)).get(bill_id)  # type: ignore
    if not bill or bill.client_id != user.client_id:
        raise HTTPException(status_code=404)
    remaining = D(bill.total_amount) - D(bill.paid_amount)
    account, txn = await PrepaidService(
        db, user, get_client_ip(None)  # type: ignore
    ).deduct_for_bill(user.client_id, bill.id, remaining)
    if not account:
        return MessageOut(message="预存余额不足或错误", code=400)
    return MessageOut(message=f"已使用预存抵扣 ¥{txn.amount if txn else 0:,.2f}")


@client_router.get("/prepaid", response_class=HTMLResponse)
async def client_prepaid_page(
    request: Request,
    page: int = 1,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    p = PaginationIn(page=page, page_size=20)
    svc = PrepaidService(db, user, get_client_ip(request))
    account = await svc.get_client_account(user.client_id)
    txns: PaginatedOut[PrepaidTxnOut] = PaginatedOut(
        items=[], total=0, page=1, page_size=20, total_pages=1,
    )
    if account:
        txns = await svc.list_txns(account.id, p)
    unpaid_count = (await db.execute(select(func.count(models.Bill.id)).where(and_(
        models.Bill.client_id == user.client_id,
        models.Bill.status.in_(["ISSUED", "PARTIAL", "OVERDUE"]),
    )))).scalar_one() or 0
    return templates.TemplateResponse(
        request, "client/prepaid.html",
        {
            "user": user, "account": account, "txns": txns, "unpaid_count": unpaid_count,
            "active_nav": "prepaid",
        },
    )


@client_router.post("/prepaid/recharge")
async def client_prepaid_recharge(
    amount: float = Form(...),
    remark: str = Form(default=""),
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    if amount <= 0:
        return MessageOut(message="充值金额需大于 0", code=400)
    acc = await PrepaidService(db, user, get_client_ip(None)).recharge(  # type: ignore
        user.client_id, D(str(amount)), remark or "客户端在线充值",
    )
    return MessageOut(
        message=f"已充值 ¥{amount:,.2f}，当前余额 ¥{acc.current_balance:,.2f}"
    )


@client_router.get("/invoices", response_class=HTMLResponse)
async def client_invoices_page(
    request: Request,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    bills = (await db.execute(select(models.Bill).where(and_(
        models.Bill.client_id == user.client_id,
        models.Bill.status != "DRAFT",
    )).order_by(desc(models.Bill.due_date)))).scalars().all()
    invoices = (await db.execute(select(models.Invoice)
        .options(selectinload(models.Invoice.bill))
        .where(models.Invoice.client_id == user.client_id)
        .order_by(desc(models.Invoice.applied_at))
        .limit(100)
    )).scalars().all()
    unpaid_count = (await db.execute(select(func.count(models.Bill.id)).where(and_(
        models.Bill.client_id == user.client_id,
        models.Bill.status.in_(["ISSUED", "PARTIAL", "OVERDUE"]),
    )))).scalar_one() or 0
    return templates.TemplateResponse(
        request, "client/invoices.html",
        {
            "user": user, "bills": bills, "invoices": invoices, "unpaid_count": unpaid_count,
            "active_nav": "invoices",
        },
    )


@client_router.post("/invoices")
async def client_invoice_create(
    bill_id: UUID = Form(...),
    title: str = Form(...),
    tax_id: str = Form(...),
    address: str = Form(default=""),
    phone: str = Form(default=""),
    bank_name: str = Form(default=""),
    bank_account: str = Form(default=""),
    amount: float = Form(...),
    type_: InvoiceType = Form(default="VAT_NORMAL", alias="type"),  # type: ignore
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    try:
        data = InvoiceCreateIn(
            bill_id=bill_id, title=title, tax_id=tax_id,
            address=address or None, phone=phone or None,
            bank_name=bank_name or None, bank_account=bank_account or None,
            amount=D(str(amount)), type=type_,  # type: ignore
        )
    except ValidationError as e:
        return MessageOut(message=f"输入格式错误: {e.errors()[0]['msg']}", code=400)
    inv = await InvoiceService(
        db, user, get_client_ip(None),  # type: ignore
    ).apply(data, client_id_override=user.client_id)
    if inv.validation_errors:
        return MessageOut(
            message=f"已提交，但存在{len(inv.validation_errors)}项信息错误需要修复",
            code=2,
        )
    return MessageOut(message="发票申请已提交")


# ---- 客户端首页 & 支付记录 ----
@client_router.get("/dashboard", response_class=HTMLResponse)
async def client_dashboard(
    request: Request,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    unpaid_count = (await db.execute(select(func.count(models.Bill.id)).where(and_(
        models.Bill.client_id == user.client_id,
        models.Bill.status.in_(["ISSUED", "PARTIAL", "OVERDUE"]),
    )))).scalar_one() or 0
    return RedirectResponse(url="/client/bills", status_code=303)


@client_router.get("/payments", response_class=HTMLResponse)
async def client_payments_page(
    request: Request,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    assert user.client_id
    # 获取账单数据（与 bills 页面相同）
    p = PaginationIn(page=1, page_size=10)
    svc = BillService(db, cache, user, get_client_ip(request))
    data: PaginatedOut[ClientBillCard] = await svc.list_client_bills(user.client_id, p, "ALL")
    prepaid = await PrepaidService(db, user, get_client_ip(request)).get_client_account(user.client_id)  # type: ignore
    # counts
    status_counts = {}
    for st in ["DRAFT", "ISSUED", "PARTIAL", "PAID", "OVERDUE"]:
        c = (await db.execute(select(func.count(models.Bill.id)).where(and_(
            models.Bill.client_id == user.client_id,
            models.Bill.status == st,
        )))).scalar_one() or 0
        status_counts[st] = int(c)
    status_counts["ALL"] = sum(status_counts.values())
    status_counts["UNPAID"] = status_counts.get("ISSUED", 0) + status_counts.get("DRAFT", 0)
    unpaid_count = status_counts["UNPAID"]
    # 支付记录
    payments = (await db.execute(select(models.Payment)
        .options(selectinload(models.Payment.bill))
        .join(models.Bill, models.Bill.id == models.Payment.bill_id)
        .where(models.Bill.client_id == user.client_id)
        .order_by(desc(models.Payment.matched_at))
        .limit(50))).scalars().all()
    return templates.TemplateResponse(
        request, "client/bills.html",
        {
            "user": user, "data": data, "status_filter": "ALL",
            "prepaid": prepaid, "counts": status_counts, "unpaid_count": unpaid_count,
            "payments": payments,
            "active_nav": "bills",
        },
    )


# ============= 注册路由 =============
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(client_router)


# ============= 异常处理器 =============
@app.exception_handler(HTTPException)
async def http_exc_handler(request: Request, exc: HTTPException):
    if exc.status_code == 303:
        location = exc.headers.get("Location") or "/auth/login"
        if request.headers.get("HX-Request") == "true":
            resp = HTMLResponse(content="")
            resp.headers["HX-Redirect"] = location
            return resp
        return RedirectResponse(url=location, status_code=303)
    if exc.status_code == 403:
        if request.headers.get("HX-Request"):
            return HTMLResponse(
                content=f'<div class="text-red-500 p-3 text-sm border border-red-200 bg-red-50 rounded">🚫 {exc.detail}</div>',
                status_code=403,
            )
        return JSONResponse({"error": exc.detail, "code": 403}, status_code=403)
    if request.headers.get("HX-Request"):
        return HTMLResponse(
            content=f'<div class="text-red-500 p-2 text-sm">❌ {exc.detail}</div>',
            status_code=exc.status_code,
        )
    return JSONResponse(
        {"error": exc.detail, "code": exc.status_code},
        status_code=exc.status_code,
    )


@app.exception_handler(ValidationError)
async def validation_exc_handler(request: Request, exc: ValidationError):
    msg = "参数校验失败"
    if exc.errors():
        e0 = exc.errors()[0]
        msg = f"{'.'.join(str(l) for l in e0['loc'])}: {e0['msg']}"
    if request.headers.get("HX-Request"):
        return HTMLResponse(
            content=f'<div class="text-red-500 p-2 text-sm">❌ {msg}</div>',
            status_code=422,
        )
    err_list = []
    for e in exc.errors():
        err_list.append({
            "loc": [str(l) for l in e.get("loc", [])],
            "msg": e.get("msg", ""),
            "type": e.get("type", ""),
        })
    return JSONResponse(
        {"error": "参数校验失败", "detail": err_list, "code": 422},
        status_code=422,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        workers=settings.workers,
    )
