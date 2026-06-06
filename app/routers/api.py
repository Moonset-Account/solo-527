from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, RedirectResponse
from app.routers.pages import get_current_user
from app.services.transfer import create_transfer_order, submit_for_review
from app.services.attachment import upload_attachment
from app.services.review import approve_order, reject_order
from app.services.finance import export_settlement_excel
from app.models import TransferOrderCreate
from datetime import date
import json
import urllib.parse

router = APIRouter(prefix="/api")

@router.post("/login")
async def login(request: Request):
    from app.database import get_db
    
    form = await request.form()
    username = form.get("username")
    password = form.get("password")
    
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT id, username, role, full_name FROM users WHERE username = ? AND password = ?",
            [username, password]
        ).fetchone()
        
        if not row:
            return JSONResponse({"success": False, "message": "用户名或密码错误"}, status_code=401)
        
        columns = [desc[0] for desc in conn.description]
        user = dict(zip(columns, row))
        
        from app.services.audit import log_action
        log_action(action="LOGIN", operator=user["id"], remark=f"用户{user['username']}登录")
        
        response = JSONResponse({"success": True, "redirect": "/transfer"})
        response.set_cookie("user_id", user["id"])
        response.set_cookie("username", user["username"])
        response.set_cookie("role", user["role"])
        full_name = user.get("full_name", "")
        if full_name:
            full_name = urllib.parse.quote(full_name)
        response.set_cookie("full_name", full_name)
        
        return response
    finally:
        conn.close()

@router.post("/logout")
async def logout(request: Request):
    response = JSONResponse({"success": True, "redirect": "/login"})
    response.delete_cookie("user_id")
    response.delete_cookie("username")
    response.delete_cookie("role")
    response.delete_cookie("full_name")
    return response

@router.post("/transfer")
async def api_create_transfer(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    
    form = await request.form()
    
    try:
        transfer_date = None
        if form.get("transfer_date"):
            transfer_date = date.fromisoformat(form.get("transfer_date"))
        
        amount = None
        if form.get("amount"):
            from decimal import Decimal
            amount = Decimal(form.get("amount"))
        
        data = TransferOrderCreate(
            order_no=form.get("order_no"),
            batch_no=form.get("batch_no"),
            transfer_date=transfer_date,
            from_warehouse=form.get("from_warehouse"),
            to_warehouse=form.get("to_warehouse"),
            amount=amount,
            carrier=form.get("carrier")
        )
        
        order = create_transfer_order(data, user["id"])
        return JSONResponse({"success": True, "order": order, "redirect": f"/transfer/{order['id']}"})
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=400)

@router.post("/transfer/{order_id}/attachment")
async def api_upload_attachment(
    request: Request,
    order_id: str,
    attachment_type: str = Form(...),
    is_supplement: bool = Form(False),
    file: UploadFile = File(...)
):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    
    try:
        attachment = upload_attachment(
            transfer_order_id=order_id,
            attachment_type=attachment_type,
            file=file,
            uploaded_by=user["id"],
            is_supplement=is_supplement
        )
        return JSONResponse({"success": True, "attachment": attachment})
    except ValueError as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=400)
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@router.post("/transfer/{order_id}/submit")
async def api_submit_review(request: Request, order_id: str):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    
    try:
        order = submit_for_review(order_id, user["id"])
        return JSONResponse({"success": True, "order": order})
    except ValueError as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=400)
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@router.post("/review/{order_id}/approve")
async def api_approve_order(request: Request, order_id: str):
    user = get_current_user(request)
    if not user or user["role"] not in ["SUPERVISOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="无权限")
    
    form = await request.form()
    comment = form.get("comment", "")
    
    try:
        order = approve_order(order_id, user["id"], comment)
        return JSONResponse({"success": True, "order": order})
    except ValueError as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=400)
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@router.post("/review/{order_id}/reject")
async def api_reject_order(request: Request, order_id: str):
    user = get_current_user(request)
    if not user or user["role"] not in ["SUPERVISOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="无权限")
    
    form = await request.form()
    comment = form.get("comment", "")
    
    try:
        order = reject_order(order_id, user["id"], comment)
        return JSONResponse({"success": True, "order": order})
    except ValueError as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=400)
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@router.get("/finance/export")
async def api_export_finance(
    request: Request,
    date_from: str = None,
    date_to: str = None,
    keyword: str = None
):
    user = get_current_user(request)
    if not user or user["role"] not in ["FINANCE", "ADMIN"]:
        raise HTTPException(status_code=403, detail="无权限")
    
    excel_data = export_settlement_excel(
        operator=user["id"],
        date_from=date_from,
        date_to=date_to,
        keyword=keyword
    )
    
    filename = f"reconciliation_{date_from or 'start'}_{date_to or 'end'}.xlsx"
    
    return StreamingResponse(
        iter([excel_data.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
