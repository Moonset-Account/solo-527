from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime
import io
import pandas as pd
from auth_utils import get_current_active_user, require_role
from database import get_db

router = APIRouter()

@router.get("/projects/excel")
async def export_projects_excel(
    status: Optional[str] = None,
    supplier: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(require_role(["auditor", "admin"]))
):
    con = get_db()
    
    query = """
        SELECT p.project_code as '项目编号',
               p.project_name as '项目名称',
               p.supplier_name as '供应商',
               p.amount as '采购金额',
               CASE p.status
                   WHEN 'draft' THEN '草稿'
                   WHEN 'pending_review' THEN '待审核'
                   WHEN 'first_reviewed' THEN '一审通过'
                   WHEN 'archived' THEN '已归档'
                   WHEN 'rejected' THEN '已退回'
               END as '状态',
               u.full_name as '创建人',
               p.created_at as '创建时间',
               p.updated_at as '更新时间'
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE 1=1
    """
    params = []
    
    if status:
        status_map = {
            "draft": "draft",
            "pending": "pending_review",
            "first_reviewed": "first_reviewed",
            "archived": "archived",
            "rejected": "rejected"
        }
        if status in status_map:
            query += " AND p.status = ?"
            params.append(status_map[status])
    
    if supplier:
        query += " AND p.supplier_name LIKE ?"
        params.append(f"%{supplier}%")
    
    if start_date:
        query += " AND p.created_at >= ?"
        params.append(start_date)
    
    if end_date:
        query += " AND p.created_at <= ?"
        params.append(end_date)
    
    query += " ORDER BY p.created_at DESC"
    
    df = con.execute(query, params).df()
    con.close()
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='采购项目')
        
        worksheet = writer.sheets['采购项目']
        for idx, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).map(len).max(),
                len(str(col))
            ) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_length, 50)
    
    output.seek(0)
    
    filename = f"采购项目报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/evidence/excel")
async def export_evidence_excel(
    project_id: Optional[int] = None,
    file_type: Optional[str] = None,
    current_user: dict = Depends(require_role(["auditor", "admin"]))
):
    con = get_db()
    
    query = """
        SELECT p.project_code as '项目编号',
               p.project_name as '项目名称',
               p.supplier_name as '供应商',
               p.amount as '采购金额',
               CASE e.file_type
                   WHEN 'price_comparison' THEN '比价截图'
                   WHEN 'supplier_quote' THEN '供应商报价'
                   WHEN 'approval_form' THEN '审批单'
               END as '证据类型',
               e.file_name as '文件名',
               e.file_size as '文件大小(字节)',
               u.full_name as '上传人',
               e.uploaded_at as '上传时间',
               CASE e.is_archived WHEN TRUE THEN '是' ELSE '否' END as '已归档'
        FROM evidence_files e
        LEFT JOIN projects p ON e.project_id = p.id
        LEFT JOIN users u ON e.uploaded_by = u.id
        WHERE 1=1
    """
    params = []
    
    if project_id:
        query += " AND e.project_id = ?"
        params.append(project_id)
    
    if file_type:
        query += " AND e.file_type = ?"
        params.append(file_type)
    
    query += " ORDER BY e.uploaded_at DESC"
    
    df = con.execute(query, params).df()
    con.close()
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='证据清单')
        
        worksheet = writer.sheets['证据清单']
        for idx, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).map(len).max(),
                len(str(col))
            ) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_length, 50)
    
    output.seek(0)
    
    filename = f"证据清单_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/review/excel")
async def export_review_excel(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(require_role(["auditor", "admin"]))
):
    con = get_db()
    
    query = """
        SELECT p.project_code as '项目编号',
               p.project_name as '项目名称',
               p.supplier_name as '供应商',
               p.amount as '采购金额',
               CASE r.review_type
                   WHEN 'first_review' THEN '一审'
                   WHEN 'second_review' THEN '二审'
               END as '审核类型',
               CASE r.decision
                   WHEN 'approve' THEN '通过'
                   WHEN 'reject' THEN '退回'
               END as '审核结果',
               u.full_name as '审核人',
               r.comments as '审核意见',
               r.reviewed_at as '审核时间'
        FROM review_records r
        LEFT JOIN projects p ON r.project_id = p.id
        LEFT JOIN users u ON r.reviewer_id = u.id
        WHERE 1=1
    """
    params = []
    
    if start_date:
        query += " AND r.reviewed_at >= ?"
        params.append(start_date)
    
    if end_date:
        query += " AND r.reviewed_at <= ?"
        params.append(end_date)
    
    query += " ORDER BY r.reviewed_at DESC"
    
    df = con.execute(query, params).df()
    con.close()
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='审核记录')
        
        worksheet = writer.sheets['审核记录']
        for idx, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).map(len).max(),
                len(str(col))
            ) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_length, 50)
    
    output.seek(0)
    
    filename = f"审核记录_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
