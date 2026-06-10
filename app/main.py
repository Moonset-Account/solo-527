from __future__ import annotations

import json
import uuid
from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path
from typing import Any, Optional
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Cookie,
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    Request,
    Response,
    status,
)
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from app import models
from app.core.config import settings
from app.core.security import hash_password  # noqa: F401
from app.db.redis_cache import RedisCache, get_cache
from app.db.session import Base, get_db_session, get_engine
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
templates = Jinja2Templates(directory=str(settings.templates_dir))
templates.env.filters["money"] = format_currency
templates.env.globals["APP_NAME"] = settings.app_name
templates.env.globals["current_year"] = __import__("datetime").datetime.now().year


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
        raise HTTPException(status_code=403, detail="管理员权限 required")
    return user


def require_client(user: SessionUser = Depends(get_current_user)) -> SessionUser:
    if user.role != "CLIENT":
        raise HTTPException(status_code=403, detail="客户权限 required")
    return user


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""


# ============= 应用生命周期 =============
@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_cache().initialize()
    engine = get_engine()
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"[警告] 自动建表失败（如数据库未启动可忽略，手动执行SQL即可）: {e}")
    try:
        async with get_db_session() as db:  # type: ignore
            auth_svc = AuthService(db, get_cache())
            await auth_svc.init_default_admin()
            mock_svc = MockDataService(db)
            res = await mock_svc.seed_all()
            print(f"[Mock数据] {res.message}")
            bill_svc = BillService(db, get_cache(), SessionUser(id=UUID(int=0), email="system", name="system", role="ADMIN"))
            n = await bill_svc.refresh_days_overdue()
            if n:
                print(f"[逾期刷新] 处理了 {n} 条逾期账单")
            await db.commit()
    except Exception as e:
        print(f"[初始化] {type(e).__name__}: {e}")
    yield
    await get_cache().close()


app = FastAPI(title=settings.app_name, lifespan=lifespan, debug=settings.debug)
app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

auth_router = APIRouter(prefix="/auth", tags=["认证"])
admin_router = APIRouter(prefix="/admin", tags=["管理端"])
client_router = APIRouter(prefix="/client", tags=["客户端"])
api_router = APIRouter(prefix="/api", tags=["API"])


# ============= 认证路由 =============
@auth_router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(request, "auth/login.html", {"error": None, "next": request.query_params.get("next", "")})


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
    except ValidationError as e:
        return templates.TemplateResponse(request, "auth/login.html", {"error": "请检查邮箱与密码格式", "next": next_url})
    auth_svc = AuthService(db, cache)
    user, sid = await auth_svc.login(login_data)
    if not user or not sid:
        return templates.TemplateResponse(request, "auth/login.html", {"error": "邮箱或密码错误", "next": next_url})
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
        data = UserRegisterIn(email=email, password=password, name=name, company_name=company_name or None)
    except ValidationError:
        return templates.TemplateResponse(request, "auth/register.html", {"error": "请检查字段格式"})
    try:
        auth_svc = AuthService(db, cache)
        await auth_svc.register_client(data)
    except Exception as e:
        return templates.TemplateResponse(request, "auth/register.html", {"error": f"注册失败: {e}"})
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
async def root_redirect(request: Request, user: SessionUser = Depends(get_current_user)):
    return RedirectResponse(url="/admin/dashboard" if user.role == "ADMIN" else "/client/bills", status_code=303)


# ============= 管理端路由 =============
@admin_router.get("/dashboard", response_class=HTMLResponse)
async def admin_dashboard(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    stats = await DashboardService(db, cache).get_stats()
    return templates.TemplateResponse(request, "admin/dashboard.html", {"user": user, "stats": stats})


@admin_router.get("/dashboard/api/stats")
async def dashboard_stats_api(
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    return await DashboardService(db, cache).get_stats()


@admin_router.get("/bills", response_class=HTMLResponse)
async def admin_bills_page(
    request: Request,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    clients_res = await db.execute(__import__("sqlalchemy").select(models.Client).order_by(models.Client.name))
    clients = clients_res.scalars().all()
    return templates.TemplateResponse(request, "admin/bills.html", {"user": user, "clients": clients})


@admin_router.get("/bills/api/list")
async def admin_bills_list(
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
        request=__build_fake_request(), name="partials/bill_rows.html",
        context={"data": result, "user": user},
    )


def __build_fake_request():
    from starlette.requests import Request as _R
    scope = {"type": "http", "method": "GET", "path": "", "headers": [], "query_string": b"", "server": None}
    return _R(scope)


@admin_router.get("/bills/{bill_id}", response_class=HTMLResponse)
async def admin_bill_detail(
    request: Request, bill_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    svc = BillService(db, cache, user, client_ip(request))
    bill = await svc.get(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="账单不存在")
    notes = await svc.get_notes(bill_id)
    audit = await svc.get_audit_logs(bill_id)
    att_stmt = __import__("sqlalchemy").select(models.Attachment).where(models.Attachment.bill_id == bill_id).order_by(__import__("sqlalchemy").desc(models.Attachment.uploaded_at))
    atts = (await db.execute(att_stmt)).scalars().all()
    payments_stmt = (__import__("sqlalchemy").select(models.Payment, models.BankTransaction.txn_no)
        .outerjoin(models.BankTransaction, models.Payment.transaction_id == models.BankTransaction.id)
        .where(models.Payment.bill_id == bill_id).order_by(__import__("sqlalchemy").desc(models.Payment.matched_at)))
    payments_raw = (await db.execute(payments_stmt)).all()
    payments = [{"pay": p, "txn_no": tn or "—"} for p, tn in payments_raw]
    return templates.TemplateResponse(
        request, "admin/bill_detail.html",
        {"user": user, "bill": bill, "notes": notes, "audits": audit, "attachments": atts, "payments": payments},
    )


@admin_router.post("/bills/{bill_id}/notes")
async def bill_add_note(
    bill_id: UUID, content: str = Form(...), is_internal: bool = Form(default=True),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    svc = BillService(db, cache, user, client_ip=None)  # type: ignore
    note = await svc.add_note(bill_id, NoteCreateIn(content=content, is_internal=is_internal))
    return templates.TemplateResponse(
        request=__build_fake_request(), name="partials/note_item.html", context={"note": note},
    )


@admin_router.get("/transactions", response_class=HTMLResponse)
async def admin_transactions_page(request: Request, user: SessionUser = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin/transactions.html", {"user": user})


@admin_router.get("/transactions/api/list")
async def txn_list_api(
    page: int = 1, page_size: int = 20, status: str = "",
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    p = PaginationIn(page=page, page_size=page_size)
    svc = TransactionService(db, user, "")
    data = await svc.list(p, status or None)  # type: ignore
    return templates.TemplateResponse(
        request=__build_fake_request(), name="partials/txn_rows.html", context={"data": data},
    )


@admin_router.post("/transactions/import")
async def txn_import_api(
    file: UploadFile = File(...),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        return MessageOut(message="仅支持 CSV 文件", code=400)
    batch = f"BATCH{__import__('datetime').datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
    content = (await file.read()).decode("utf-8", errors="ignore")
    svc = TransactionService(db, user, "")
    result: TransactionImportResult = await svc.import_csv(content, batch)
    return result


@admin_router.post("/transactions/auto-match")
async def txn_auto_match(
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
async def txn_manual_match(
    txn_id: UUID, bill_id: UUID = Form(...), amount: float = Form(...),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    from decimal import Decimal as D
    return await TransactionService(db, user, "").manual_match(txn_id, UUID(bill_id), D(str(amount)))


@admin_router.get("/invoices", response_class=HTMLResponse)
async def admin_invoices_page(request: Request, user: SessionUser = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin/invoices.html", {"user": user})


@admin_router.get("/invoices/api/list")
async def invoices_list_api(
    page: int = 1, page_size: int = 20, status: str = "",
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    p = PaginationIn(page=page, page_size=page_size)
    data = await InvoiceService(db, user, "").list(p, status or None)  # type: ignore
    return templates.TemplateResponse(
        request=__build_fake_request(), name="partials/invoice_rows.html", context={"data": data},
    )


@admin_router.post("/invoices/{inv_id}/status")
async def invoice_status_update(
    inv_id: UUID, status: InvoiceStatus = Form(...),  # type: ignore
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    inv = await InvoiceService(db, user, "").update_status(inv_id, status)  # type: ignore
    if not inv:
        raise HTTPException(status_code=404, detail="发票不存在")
    return inv


@admin_router.get("/prepaid", response_class=HTMLResponse)
async def admin_prepaid_page(request: Request, user: SessionUser = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin/prepaid.html", {"user": user})


@admin_router.get("/prepaid/api/list")
async def prepaid_list_api(
    page: int = 1, page_size: int = 20,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    p = PaginationIn(page=page, page_size=page_size)
    data: PaginatedOut[PrepaidAccountOut] = await PrepaidService(db, user, "").list_accounts(p)
    return templates.TemplateResponse(
        request=__build_fake_request(), name="partials/prepaid_rows.html", context={"data": data},
    )


@admin_router.get("/anomalies", response_class=HTMLResponse)
async def admin_anomalies_page(request: Request, user: SessionUser = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin/anomalies.html", {"user": user})


@admin_router.get("/anomalies/api/list")
async def anomalies_list_api(
    page: int = 1, page_size: int = 20, type_filter: str = "", status_filter: str = "",
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    p = PaginationIn(page=page, page_size=page_size)
    svc = AnomalyService(db, user)
    data = await svc.list(p, type_filter or None, status_filter or None)  # type: ignore
    return templates.TemplateResponse(
        request=__build_fake_request(), name="partials/anomaly_rows.html", context={"data": data},
    )


@admin_router.post("/anomalies/{anom_id}/resolve")
async def anomaly_resolve(
    anom_id: UUID, data: AnomalyResolveIn,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    anom = await AnomalyService(db, user).resolve(anom_id, data)
    if not anom:
        raise HTTPException(status_code=404)
    return anom


@admin_router.get("/exports", response_class=HTMLResponse)
async def admin_exports_page(request: Request, user: SessionUser = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin/exports.html", {"user": user})


@admin_router.get("/exports/api/list")
async def exports_list_api(
    page: int = 1, page_size: int = 20,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    p = PaginationIn(page=page, page_size=page_size)
    data = await ExportService(db, cache, user).list_tasks(p)
    return templates.TemplateResponse(
        request=__build_fake_request(), name="partials/export_rows.html", context={"data": data},
    )


@admin_router.post("/exports")
async def exports_create(
    bg: BackgroundTasks, type_: ExportType = Form(alias="type"),  # type: ignore
    days: int = Form(default=30),
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    svc = ExportService(db, cache, user)
    task = await svc.create_task(ExportCreateIn(type=type_, parameters={"days": days}))  # type: ignore

    async def _do():
        async with get_db_session() as s:
            try:
                await ExportService(s, cache, user).execute_task(task.id)
            except Exception as e:
                print(f"[导出失败] {e}")

    bg.add_task(_do)
    return task


@admin_router.get("/exports/{task_id}/download")
async def exports_download(
    task_id: UUID,
    user: SessionUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    path = await ExportService(db, cache, user).get_download_path(task_id)
    if not path:
        raise HTTPException(status_code=404, detail="文件不存在或未完成")
    return FileResponse(path, filename=path.name, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


# ============= 客户端路由 =============
@client_router.get("/bills", response_class=HTMLResponse)
async def client_bills_page(
    request: Request, status: str = "ALL", page: int = 1,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    assert user.client_id
    p = PaginationIn(page=page, page_size=10)
    svc = BillService(db, cache, user, client_ip(request))
    data: PaginatedOut[ClientBillCard] = await svc.list_client_bills(user.client_id, p, status)
    prepaid = await PrepaidService(db, user, "").get_client_account(user.client_id)
    return templates.TemplateResponse(
        request, "client/bills.html",
        {"user": user, "data": data, "status_filter": status, "prepaid": prepaid},
    )


@client_router.get("/bills/{bill_id}", response_class=HTMLResponse)
async def client_bill_detail(
    request: Request, bill_id: UUID,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
    cache: RedisCache = Depends(get_cache),
):
    assert user.client_id
    bill = await BillService(db, cache, user, "").get(bill_id)
    if not bill or bill.client_id != user.client_id:
        raise HTTPException(status_code=404)
    prepaid = await PrepaidService(db, user, "").get_client_account(user.client_id)
    remaining = bill.total_amount - bill.paid_amount
    use_prepaid = prepaid is not None and prepaid.current_balance > 0
    deduct = min(prepaid.current_balance if prepaid else 0, remaining)
    actual = max(remaining - (deduct if use_prepaid else 0), 0)
    preview = ClientPayPreview(
        bill_id=bill.id, bill_no=bill.bill_no, remaining_amount=remaining,
        use_prepaid=use_prepaid, prepaid_deduct=deduct, actual_pay=actual,
        prepaid_balance=prepaid.current_balance if prepaid else 0,
    )
    return templates.TemplateResponse(
        request, "client/bill_detail.html",
        {"user": user, "bill": bill, "prepaid": prepaid, "preview": preview},
    )


@client_router.post("/bills/{bill_id}/pay/prepaid")
async def client_pay_prepaid(
    bill_id: UUID,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    bill = await BillService(db, get_cache(), user, "").get(bill_id)
    if not bill or bill.client_id != user.client_id:
        raise HTTPException(status_code=404)
    remaining = bill.total_amount - bill.paid_amount
    account, txn = await PrepaidService(db, user, "").deduct_for_bill(user.client_id, bill.id, remaining)
    if not account:
        return MessageOut(message="预存余额不足或错误", code=400)
    return MessageOut(message=f"已使用预存抵扣 ¥{txn.amount if txn else 0:,.2f}")


@client_router.get("/prepaid", response_class=HTMLResponse)
async def client_prepaid_page(
    request: Request, page: int = 1,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    p = PaginationIn(page=page, page_size=20)
    svc = PrepaidService(db, user, "")
    account = await svc.get_client_account(user.client_id)
    txns: PaginatedOut[PrepaidTxnOut] = PaginatedOut(items=[], total=0, page=1, page_size=20, total_pages=1)
    if account:
        txns = await svc.list_txns(account.id, p)
    return templates.TemplateResponse(
        request, "client/prepaid.html",
        {"user": user, "account": account, "txns": txns},
    )


@client_router.post("/prepaid/recharge")
async def client_prepaid_recharge(
    amount: float = Form(...),
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    from decimal import Decimal as D
    assert user.client_id
    if amount <= 0:
        return MessageOut(message="充值金额需大于 0", code=400)
    acc = await PrepaidService(db, user, "").recharge(user.client_id, D(str(amount)), "客户端在线充值（模拟）")
    return MessageOut(message=f"已充值 ¥{amount:,.2f}，当前余额 ¥{acc.current_balance:,.2f}")


@client_router.get("/invoices", response_class=HTMLResponse)
async def client_invoices_page(
    request: Request,
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    assert user.client_id
    bills_stmt = (select(models.Bill).where(
        and_(models.Bill.client_id == user.client_id, models.Bill.status != "DRAFT")
    ).order_by(desc(models.Bill.due_date)))
    bills = (await db.execute(bills_stmt)).scalars().all()
    inv_stmt = (select(models.Invoice).where(models.Invoice.client_id == user.client_id)
        .options(selectinload(models.Invoice.bill))
        .order_by(desc(models.Invoice.applied_at)).limit(100))
    invoices = (await db.execute(inv_stmt)).scalars().all()
    return templates.TemplateResponse(
        request, "client/invoices.html",
        {"user": user, "bills": bills, "invoices": invoices},
    )


@client_router.post("/invoices")
async def client_invoice_apply(
    bill_id: UUID = Form(...), title: str = Form(...), tax_id: str = Form(...),
    address: str = Form(default=""), phone: str = Form(default=""),
    bank_name: str = Form(default=""), bank_account: str = Form(default=""),
    amount: float = Form(...), type_: InvoiceType = Form(default="VAT_NORMAL", alias="type"),  # type: ignore
    user: SessionUser = Depends(require_client),
    db: AsyncSession = Depends(get_db_session),
):
    from decimal import Decimal as D
    assert user.client_id
    try:
        data = InvoiceCreateIn(
            bill_id=bill_id, title=title, tax_id=tax_id, address=address or None,
            phone=phone or None, bank_name=bank_name or None, bank_account=bank_account or None,
            amount=D(str(amount)), type=type_,  # type: ignore
        )
    except ValidationError as e:
        return MessageOut(message=f"输入格式错误: {e.errors()[0]['msg']}", code=400)
    inv = await InvoiceService(db, user, "").apply(data, client_id_override=user.client_id)
    if inv.validation_errors:
        return MessageOut(message=f"已提交，但存在{len(inv.validation_errors)}项信息错误需要修复", code=2)
    return MessageOut(message="发票申请已提交")


# ============= 注册路由 =============
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(client_router)


@app.exception_handler(HTTPException)
async def http_exc_handler(request: Request, exc: HTTPException):
    if exc.status_code == 303:
        location = exc.headers.get("Location") or "/auth/login"
        if request.headers.get("HX-Request") == "true":
            resp = HTMLResponse(content=f'<html><head><meta http-equiv="refresh" content="0; url={location}"></head></html>')
            resp.headers["HX-Redirect"] = location
            return resp
        return RedirectResponse(url=location, status_code=303)
    if exc.status_code == 403:
        content = {"error": exc.detail, "code": 403}
        if request.headers.get("HX-Request"):
            return HTMLResponse(content=f'<div class="text-red-500 p-2 text-sm">{exc.detail}</div>', status_code=403)
        return JSONResponse(content, status_code=403)
    return JSONResponse({"error": exc.detail, "code": exc.status_code}, status_code=exc.status_code)


@app.exception_handler(ValidationError)
async def validation_exc_handler(request: Request, exc: ValidationError):
    return JSONResponse({"error": "参数校验失败", "detail": exc.errors(), "code": 422}, status_code=422)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        workers=settings.workers,
    )
