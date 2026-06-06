import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from auth_utils import get_current_active_user, require_role
from database import get_db, get_next_id
from datetime import datetime
import uuid

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

class CommentCreate(BaseModel):
    comment_text: str

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_DOC_TYPES = {
    "application/pdf", 
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

@router.post("/preview")
async def preview_evidence(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    file_size = 0
    preview_url = None
    is_previewable = False
    
    if file.content_type in ALLOWED_IMAGE_TYPES:
        is_previewable = True
    
    content = await file.read()
    file_size = len(content)
    
    await file.seek(0)
    
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file_size,
        "is_previewable": is_previewable,
        "preview_available": is_previewable,
        "size_human": f"{file_size / 1024:.2f} KB"
    }

@router.post("/{project_id}")
async def upload_evidence(
    project_id: int,
    file_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["buyer", "admin"]))
):
    if file_type not in ["price_comparison", "supplier_quote", "approval_form"]:
        raise HTTPException(status_code=400, detail="无效的文件类型")
    
    con = get_db()
    project = con.execute("SELECT id, created_by, status FROM projects WHERE id = ?", [project_id]).fetchone()
    
    if not project:
        con.close()
        raise HTTPException(status_code=404, detail="项目不存在")
    
    if current_user["role"] == "buyer" and project[1] != current_user["id"]:
        con.close()
        raise HTTPException(status_code=403, detail="无权操作此项目")
    
    if project[2] == "archived":
        con.close()
        raise HTTPException(status_code=400, detail="项目已归档，无法上传新证据，只能追加说明")
    
    project_dir = os.path.join(UPLOAD_DIR, str(project_id))
    os.makedirs(project_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(project_dir, unique_filename)
    
    content = await file.read()
    file_size = len(content)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    relative_path = os.path.join(str(project_id), unique_filename)
    
    evidence_id = get_next_id(con, "evidence_files")
    con.execute("""
        INSERT INTO evidence_files (id, project_id, file_type, file_name, file_path, file_size, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [evidence_id, project_id, file_type, file.filename, relative_path, file_size, current_user["id"]])
    
    audit_id = get_next_id(con, "audit_logs")
    con.execute("""
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details)
        VALUES (?, ?, 'upload', 'evidence', ?, ?)
    """, [audit_id, current_user["id"], evidence_id, f"上传证据: {file.filename}"])
    
    con.commit()
    con.close()
    
    return {
        "id": evidence_id,
        "message": "上传成功",
        "file_path": f"/uploads/{relative_path}",
        "file_name": file.filename,
        "file_type": file_type
    }

@router.get("/{evidence_id}")
async def get_evidence_detail(
    evidence_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    con = get_db()
    evidence = con.execute("""
        SELECT e.id, e.project_id, e.file_type, e.file_name, e.file_path, 
               e.file_size, e.uploaded_by, u.full_name, e.uploaded_at, e.is_archived,
               p.created_by, p.status
        FROM evidence_files e
        LEFT JOIN users u ON e.uploaded_by = u.id
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.id = ?
    """, [evidence_id]).fetchone()
    
    if not evidence:
        con.close()
        raise HTTPException(status_code=404, detail="证据不存在")
    
    if current_user["role"] == "buyer" and evidence[10] != current_user["id"]:
        con.close()
        raise HTTPException(status_code=403, detail="无权访问此证据")
    
    comments = con.execute("""
        SELECT c.id, c.comment_text, u.full_name, c.created_at
        FROM evidence_comments c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.evidence_id = ?
        ORDER BY c.created_at DESC
    """, [evidence_id]).fetchall()
    
    con.close()
    
    return {
        "id": evidence[0],
        "project_id": evidence[1],
        "file_type": evidence[2],
        "file_name": evidence[3],
        "file_path": f"/uploads/{evidence[4]}",
        "file_size": evidence[5],
        "uploaded_by": evidence[6],
        "uploader_name": evidence[7],
        "uploaded_at": str(evidence[8]),
        "is_archived": evidence[9],
        "project_status": evidence[11],
        "comments": [
            {
                "id": c[0],
                "comment_text": c[1],
                "creator_name": c[2],
                "created_at": str(c[3])
            }
            for c in comments
        ]
    }

@router.delete("/{evidence_id}")
async def delete_evidence(
    evidence_id: int,
    current_user: dict = Depends(require_role(["buyer", "admin"]))
):
    con = get_db()
    evidence = con.execute("""
        SELECT e.id, e.project_id, e.file_path, e.is_archived, e.uploaded_by, p.created_by, p.status
        FROM evidence_files e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.id = ?
    """, [evidence_id]).fetchone()
    
    if not evidence:
        con.close()
        raise HTTPException(status_code=404, detail="证据不存在")
    
    if evidence[3]:
        con.close()
        raise HTTPException(status_code=400, detail="已归档的证据不能删除，只能追加说明")
    
    if evidence[6] not in ["draft", "rejected"]:
        con.close()
        raise HTTPException(status_code=400, detail="已提交的证据不能删除")
    
    if current_user["role"] == "buyer" and evidence[4] != current_user["id"]:
        con.close()
        raise HTTPException(status_code=403, detail="无权删除此证据")
    
    file_full_path = os.path.join(UPLOAD_DIR, evidence[2])
    if os.path.exists(file_full_path):
        os.remove(file_full_path)
    
    con.execute("DELETE FROM evidence_comments WHERE evidence_id = ?", [evidence_id])
    con.execute("DELETE FROM evidence_files WHERE id = ?", [evidence_id])
    
    audit_id = get_next_id(con, "audit_logs")
    con.execute("""
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details)
        VALUES (?, ?, 'delete', 'evidence', ?, ?)
    """, [audit_id, current_user["id"], evidence_id, "删除证据"])
    
    con.commit()
    con.close()
    
    return {"message": "删除成功"}

@router.post("/{evidence_id}/comments")
async def add_comment(
    evidence_id: int,
    comment: CommentCreate,
    current_user: dict = Depends(get_current_active_user)
):
    con = get_db()
    evidence = con.execute("""
        SELECT e.id, e.project_id, p.created_by
        FROM evidence_files e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.id = ?
    """, [evidence_id]).fetchone()
    
    if not evidence:
        con.close()
        raise HTTPException(status_code=404, detail="证据不存在")
    
    if current_user["role"] == "buyer" and evidence[2] != current_user["id"]:
        con.close()
        raise HTTPException(status_code=403, detail="无权操作此证据")
    
    comment_id = get_next_id(con, "evidence_comments")
    con.execute("""
        INSERT INTO evidence_comments (id, evidence_id, comment_text, created_by)
        VALUES (?, ?, ?, ?)
    """, [comment_id, evidence_id, comment.comment_text, current_user["id"]])
    
    audit_id = get_next_id(con, "audit_logs")
    con.execute("""
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details)
        VALUES (?, ?, 'comment', 'evidence', ?, ?)
    """, [audit_id, current_user["id"], evidence_id, f"追加说明: {comment.comment_text[:50]}"])
    
    con.commit()
    con.close()
    
    return {"id": comment_id, "message": "说明已追加"}

@router.get("/wall/list")
async def evidence_wall(
    page: int = 1,
    page_size: int = 20,
    file_type: Optional[str] = None,
    project_id: Optional[int] = None,
    current_user: dict = Depends(get_current_active_user)
):
    con = get_db()
    offset = (page - 1) * page_size
    
    where_clause = "WHERE 1=1"
    params = []
    
    if current_user["role"] == "buyer":
        where_clause += " AND p.created_by = ?"
        params.append(current_user["id"])
    
    if file_type:
        where_clause += " AND e.file_type = ?"
        params.append(file_type)
    if project_id:
        where_clause += " AND e.project_id = ?"
        params.append(project_id)
    
    count_query = f"""
        SELECT COUNT(*)
        FROM evidence_files e
        LEFT JOIN projects p ON e.project_id = p.id
        {where_clause}
    """
    total = con.execute(count_query, params).fetchone()[0]
    
    query = f"""
        SELECT e.id, e.file_type, e.file_name, e.file_path, e.uploaded_at,
               u.full_name, p.project_code, p.project_name, p.supplier_name, p.amount, p.status
        FROM evidence_files e
        LEFT JOIN users u ON e.uploaded_by = u.id
        LEFT JOIN projects p ON e.project_id = p.id
        {where_clause}
        ORDER BY e.uploaded_at DESC LIMIT ? OFFSET ?
    """
    params_with_limit = params.copy()
    params_with_limit.extend([page_size, offset])
    evidence = con.execute(query, params_with_limit).fetchall()
    con.close()
    
    file_type_map = {
        "price_comparison": "比价截图",
        "supplier_quote": "供应商报价",
        "approval_form": "审批单"
    }
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": e[0],
                "file_type": e[1],
                "file_type_name": file_type_map.get(e[1], e[1]),
                "file_name": e[2],
                "file_path": f"/uploads/{e[3]}",
                "uploaded_at": str(e[4]),
                "uploader_name": e[5],
                "project_code": e[6],
                "project_name": e[7],
                "supplier_name": e[8],
                "amount": float(e[9]) if e[9] else 0,
                "project_status": e[10]
            }
            for e in evidence
        ]
    }
