from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Request, Depends, Form, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import os
from ..config import settings
from ..database import get_db
from ..auth import get_current_user
from sqlalchemy import and_
from ..models import User, PhotoSelection
from ..schemas import (
    BatchPhotoSelection, OrderCreate, OrderUpdate, OrderStatus,
    ExceptionTicketCreate, ExceptionTicketUpdate, UserCreate, UserUpdate,
    SatisfactionTraceFilter, ApiResponse
)
from ..services.order_service import OrderService
from ..services.exception_service import ExceptionService
from ..services.admin_service import AdminService
from ..services.trace_service import TraceService

router = APIRouter(prefix="/api")

templates = Jinja2Templates(directory=settings.TEMPLATES_DIR)


@router.post("/orders/{order_id}/photos/{photo_id}/toggle")
async def toggle_photo_selection(
    request: Request,
    order_id: int,
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    
    existing = db.query(PhotoSelection).filter(
        and_(PhotoSelection.id == photo_id, PhotoSelection.order_id == order_id)
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="照片不存在")
    
    new_is_selected = not existing.is_selected
    
    selection = order_service.update_photo_selection(
        order_id, photo_id, new_is_selected, None, current_user
    )
    
    order = order_service.get_order(order_id, current_user)
    photo_selections = order_service.get_photo_selections(order_id, current_user)
    
    selected_count = sum(1 for p in photo_selections if p.is_selected)
    
    from fastapi.responses import HTMLResponse as HTML
    resp = templates.TemplateResponse(
        "partials/selection_count.html",
        {
            "request": request,
            "order": order,
            "photo_selections": photo_selections,
            "current_user": current_user,
            "selected_count": selected_count
        }
    )
    resp.headers["HX-Trigger-After-Swap"] = '{"selectionChanged": {"count": ' + str(selected_count) + ', "photoId": ' + str(photo_id) + ', "selected": ' + str(bool(new_is_selected)).lower() + '}}'
    return resp


@router.post("/orders/{order_id}/photos/batch")
async def batch_photo_selection(
    request: Request,
    order_id: int,
    photo_ids: str = Form(...),
    is_selected: bool = Form(True),
    selection_note: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    
    photo_id_list = [int(pid) for pid in photo_ids.split(",") if pid.strip()]
    
    updated_count, selected_count = order_service.batch_update_photo_selections(
        order_id, photo_id_list, is_selected, selection_note, current_user
    )
    
    order = order_service.get_order(order_id, current_user)
    photo_selections = order_service.get_photo_selections(order_id, current_user)
    
    return templates.TemplateResponse(
        "partials/selection_count.html",
        {
            "request": request,
            "order": order,
            "photo_selections": photo_selections,
            "current_user": current_user,
            "selected_count": selected_count,
            "message": f"已更新 {updated_count} 张照片，已选择 {selected_count} 张"
        }
    )


@router.post("/orders/{order_id}/confirm-selection")
async def confirm_selection(
    request: Request,
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    
    try:
        order = order_service.confirm_selection(order_id, current_user)
        return HTMLResponse(
            content=f"""
            <div class="alert alert-success">
                选片已确认！订单状态已更新为：已选片
                <button onclick="window.location.href='/orders/{order_id}'" class="btn btn-primary ml-4">
                    返回订单详情
                </button>
            </div>
            """,
            status_code=200
        )
    except HTTPException as e:
        return HTMLResponse(
            content=f"<div class='alert alert-error'>{e.detail}</div>",
            status_code=400
        )


@router.get("/orders")
async def get_orders_api(
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..schemas import OrderListFilter
    order_service = OrderService(db)
    
    filter_params = OrderListFilter(
        status=status,
        page=page,
        page_size=page_size,
        keyword=keyword
    )
    
    orders = order_service.list_orders(filter_params, current_user)
    
    return ApiResponse(
        code=200,
        message="success",
        data={
            "items": [dict(o) for o in orders.items],
            "total": orders.total,
            "page": orders.page,
            "page_size": orders.page_size,
            "total_pages": orders.total_pages
        }
    )


@router.post("/orders")
async def create_order_api(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="只有管理员可以创建订单")
    
    order_service = OrderService(db)
    order = order_service.create_order(order_data, current_user)
    
    return ApiResponse(code=200, message="创建成功", data={"id": order.id})


@router.put("/orders/{order_id}")
async def update_order_api(
    order_id: int,
    update_data: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    order = order_service.update_order(order_id, update_data, current_user)
    
    return ApiResponse(code=200, message="更新成功", data={"id": order.id})


@router.post("/orders/{order_id}/status")
async def update_order_status_api(
    order_id: int,
    new_status: OrderStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    order = order_service.update_order_status(order_id, new_status, current_user)
    
    return ApiResponse(code=200, message="状态更新成功", data={"id": order.id, "status": order.status})


@router.post("/orders/{order_id}/status-form")
async def update_order_status_form(
    request: Request,
    order_id: int,
    status: str = Form(...),
    remark: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    try:
        enum_status = OrderStatus(status)
    except ValueError:
        return HTMLResponse(
            content=f"<div class='alert alert-error'>无效的订单状态: {status}</div>",
            status_code=400
        )
    try:
        order = order_service.update_order_status(order_id, enum_status, current_user)
        status_label = {
            'pending': '待开始', 'shooting': '拍摄中', 'selecting': '选片中',
            'selected': '已选片', 'editing': '精修中', 'delivered': '已交付',
            'confirmed': '已确认', 'completed': '已完成', 'cancelled': '已取消'
        }.get(order.status, order.status)
        return HTMLResponse(
            content=f"""
            <div id="statusModal" class="modal-overlay" style="display:flex;">
                <div class="modal modal-medium">
                    <div class="modal-header">
                        <h3 class="modal-title">状态更新成功</h3>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success" style="margin-bottom:16px;">
                            订单状态已更新为: <strong>{status_label}</strong>
                        </div>
                        <p class="text-muted">3 秒后自动刷新订单详情页...</p>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-primary" onclick="window.location.href='/orders/{order_id}'">
                            立即刷新
                        </button>
                    </div>
                    <script>
                        setTimeout(function() {{ window.location.href = '/orders/{order_id}'; }}, 3000);
                    </script>
                </div>
            </div>
            """,
            status_code=200
        )
    except HTTPException as e:
        return HTMLResponse(
            content=f"""
            <div class="alert alert-error">
                操作失败: {e.detail}
            </div>
            <div class="modal-actions" style="margin-top:16px;">
                <button type="button" class="btn btn-ghost" onclick="document.getElementById('statusModal').style.display='none'">关闭</button>
            </div>
            """,
            status_code=400
        )


@router.post("/files/{file_id}/download")
async def mark_file_downloaded(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    file = order_service.mark_file_downloaded(file_id, current_user)
    
    file_path = os.path.join(settings.UPLOAD_DIR, file.file_path)
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename=file.file_name,
            media_type="application/octet-stream"
        )
    
    return ApiResponse(code=404, message="文件不存在")


@router.get("/files/{file_id}/download")
async def download_file_get(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    file = order_service.mark_file_downloaded(file_id, current_user)
    
    file_path = os.path.join(settings.UPLOAD_DIR, file.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(
        path=file_path,
        filename=file.file_name,
        media_type="application/octet-stream"
    )


@router.get("/orders/{order_id}/files/{file_id}/download")
async def download_order_file_get(
    order_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await download_file_get(file_id, current_user, db)


@router.post("/exceptions")
async def create_exception_api(
    exception_data: ExceptionTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="只有管理员可以创建异常工单")
    
    exception_service = ExceptionService(db)
    ticket = exception_service.create_exception(exception_data, current_user)
    
    return ApiResponse(code=200, message="创建成功", data={"id": ticket.id})


@router.put("/exceptions/{ticket_id}")
async def update_exception_api(
    ticket_id: int,
    update_data: ExceptionTicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    ticket = exception_service.update_exception(ticket_id, update_data, current_user)
    
    return ApiResponse(code=200, message="更新成功", data={"id": ticket.id})


@router.post("/exceptions/{ticket_id}/process")
async def process_exception_api(
    ticket_id: int,
    resolution: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    ticket = exception_service.process_exception(ticket_id, resolution, current_user)
    
    return HTMLResponse(
        content=f"""
        <div class="alert alert-success">
            异常工单已处理完成！
            <button onclick="window.location.href='/exceptions/{ticket_id}'" class="btn btn-primary ml-4">
                查看详情
            </button>
        </div>
        """,
        status_code=200
    )


@router.post("/exceptions/{ticket_id}/handle")
async def handle_exception_form_api(
    request: Request,
    ticket_id: int,
    status: str = Form(...),
    result: str = Form(...),
    reason: str = Form(...),
    remark: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    try:
        ticket = exception_service.handle_exception_form(
            ticket_id, status, result, reason, remark, current_user
        )
        status_label = {
            'pending': '待处理', 'processing': '处理中',
            'resolved': '已解决', 'closed': '已关闭'
        }.get(ticket.status, ticket.status)
        return HTMLResponse(
            content=f"""
            <div id="handleModal" class="modal-overlay" style="display:flex;">
                <div class="modal modal-medium">
                    <div class="modal-header">
                        <h3 class="modal-title">提交成功</h3>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success" style="margin-bottom:16px;">
                            异常工单处理完成！工单状态已更新为：<strong>{status_label}</strong>
                        </div>
                        <p class="text-muted">3 秒后自动刷新异常池列表...</p>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-primary" onclick="window.location.href='/exceptions'">
                            立即刷新
                        </button>
                    </div>
                    <script>
                        setTimeout(function() {{ window.location.href = '/exceptions'; }}, 3000);
                    </script>
                </div>
            </div>
            """,
            status_code=200
        )
    except HTTPException as e:
        return HTMLResponse(
            content=f"""
            <div class="alert alert-error">
                操作失败: {e.detail}
            </div>
            <div class="modal-actions" style="margin-top:16px;">
                <button type="button" class="btn btn-ghost" onclick="document.getElementById('handleModal').style.display='none'">关闭</button>
            </div>
            """,
            status_code=400
        )


@router.post("/exceptions/{ticket_id}/close-form")
async def close_exception_form_api(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    try:
        ticket = exception_service.close_exception(ticket_id, current_user)
        return HTMLResponse(
            content=f"""
            <div id="handleModal" class="modal-overlay" style="display:flex;">
                <div class="modal modal-medium">
                    <div class="modal-header">
                        <h3 class="modal-title">关闭成功</h3>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success">工单已成功关闭！</div>
                        <p class="text-muted">3 秒后自动刷新...</p>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-primary" onclick="window.location.href='/exceptions'">立即刷新</button>
                    </div>
                    <script>
                        setTimeout(function() {{ window.location.href = '/exceptions'; }}, 3000);
                    </script>
                </div>
            </div>
            """,
            status_code=200
        )
    except HTTPException as e:
        return HTMLResponse(
            content=f"<div class='alert alert-error'>关闭失败: {e.detail}</div>",
            status_code=400
        )


@router.post("/exceptions/{ticket_id}/close")
async def close_exception_api(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    ticket = exception_service.close_exception(ticket_id, current_user)
    
    return ApiResponse(code=200, message="工单已关闭", data={"id": ticket.id})


@router.post("/admin/users")
async def create_user_api(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    admin_service = AdminService(db)
    user = admin_service.create_user(user_data, current_user)
    
    return ApiResponse(code=200, message="创建成功", data={"id": user.id})


@router.put("/admin/users/{user_id}")
async def update_user_api(
    user_id: int,
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    admin_service = AdminService(db)
    user = admin_service.update_user(user_id, update_data, current_user)
    
    return ApiResponse(code=200, message="更新成功", data={"id": user.id})


@router.post("/admin/users/{user_id}/toggle-test")
async def toggle_test_account_api(
    user_id: int,
    is_test_account: bool = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    admin_service = AdminService(db)
    user = admin_service.toggle_test_account(user_id, is_test_account, current_user)
    
    return HTMLResponse(
        content=f"""
        <tr>
            <td>{user.id}</td>
            <td>{user.username}</td>
            <td>{user.name}</td>
            <td>{user.role}</td>
            <td>
                <span class="badge {'bg-warning' if user.is_test_account else 'bg-success'}">
                    {'测试账号' if user.is_test_account else '正常账号'}
                </span>
            </td>
            <td>{user.created_at.strftime('%Y-%m-%d')}</td>
            <td>
                <button 
                    hx-post="/api/admin/users/{user.id}/toggle-test"
                    hx-vals='{{"is_test_account": {"true" if not user.is_test_account else "false"}}}'
                    hx-target="closest tr"
                    hx-swap="outerHTML"
                    class="btn btn-sm btn-secondary"
                >
                    {'标记为正常' if user.is_test_account else '标记为测试'}
                </button>
            </td>
        </tr>
        """,
        status_code=200
    )


@router.get("/trace/satisfaction/stats")
async def get_satisfaction_stats_api(
    filter_params: SatisfactionTraceFilter = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trace_service = TraceService(db)
    stats = trace_service.get_satisfaction_stats(filter_params, current_user)
    
    return ApiResponse(code=200, message="success", data=stats)


@router.get("/trace/overall")
async def get_overall_stats_api(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trace_service = TraceService(db)
    stats = trace_service.get_overall_stats(current_user)
    
    return ApiResponse(code=200, message="success", data=stats)


@router.get("/exceptions/stats")
async def get_exception_stats_api(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    stats = exception_service.get_exception_stats(current_user)
    
    return ApiResponse(code=200, message="success", data=stats)


@router.post("/exceptions/auto-detect")
async def auto_detect_exceptions_api(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="只有管理员可以执行此操作")
    
    exception_service = ExceptionService(db)
    detected = exception_service.auto_detect_exceptions()
    
    return ApiResponse(
        code=200,
        message=f"检测完成，发现 {len(detected)} 个新异常",
        data={"count": len(detected)}
    )


@router.get("/exceptions/{ticket_id}/logs")
async def get_exception_logs_api(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception_service = ExceptionService(db)
    logs = exception_service.get_exception_logs(ticket_id, current_user)
    if not logs:
        return HTMLResponse(
            content='<p class="text-muted" style="text-align:center;padding:24px;">暂无处理记录</p>',
            status_code=200
        )
    def _status_label(s):
        return {'pending':'待处理','processing':'处理中','resolved':'已解决','closed':'已关闭'}.get(s, s)
    rows = []
    for lg in logs:
        op_name = '-'
        try:
            if lg.operator:
                op_name = lg.operator.name
        except Exception:
            pass
        rows.append(f"""
        <div class="log-item" style="padding:12px 16px;border-left:3px solid #e5e7eb;margin-bottom:12px;background:#fafafa;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong style="font-size:14px;">{lg.action or '-'}</strong>
                <span style="font-size:12px;color:#6b7280;">{lg.created_at.strftime('%Y-%m-%d %H:%M') if lg.created_at else '-'}</span>
            </div>
            <div style="font-size:13px;color:#4b5563;">操作人: {op_name or '系统'}</div>
            {f'<div style="font-size:13px;color:#374151;margin-top:6px;white-space:pre-line;">{lg.remark or ""}</div>' if lg.remark else ''}
        </div>
        """)
    return HTMLResponse(
        content='<div style="max-height:60vh;overflow:auto;">' + ''.join(rows) + '</div>',
        status_code=200
    )
