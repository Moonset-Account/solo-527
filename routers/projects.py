from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from auth_utils import get_current_active_user, require_role
from database import get_db, get_next_id
import uuid
from datetime import datetime

router = APIRouter()

class ProjectCreate(BaseModel):
    project_code: str
    project_name: str
    supplier_name: str
    amount: float

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    supplier_name: Optional[str] = None
    amount: Optional[float] = None

class ProjectResponse(BaseModel):
    id: int
    project_code: str
    project_name: str
    supplier_name: str
    amount: float
    status: str
    created_by: int
    creator_name: str
    created_at: str
    updated_at: str
    evidence_count: int

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    status: Optional[str] = None,
    supplier: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    current_user: dict = Depends(get_current_active_user)
):
    con = get_db()
    query = """
        SELECT p.id, p.project_code, p.project_name, p.supplier_name, p.amount, 
               p.status, p.created_by, u.full_name, p.created_at, p.updated_at,
               (SELECT COUNT(*) FROM evidence_files e WHERE e.project_id = p.id) as evidence_count
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE 1=1
    """
    params = []
    
    if current_user["role"] == "buyer":
        query += " AND p.created_by = ?"
        params.append(current_user["id"])
    
    if status:
        query += " AND p.status = ?"
        params.append(status)
    if supplier:
        query += " AND p.supplier_name LIKE ?"
        params.append(f"%{supplier}%")
    if min_amount is not None:
        query += " AND p.amount >= ?"
        params.append(min_amount)
    if max_amount is not None:
        query += " AND p.amount <= ?"
        params.append(max_amount)
    
    query += " ORDER BY p.created_at DESC"
    
    projects = con.execute(query, params).fetchall()
    con.close()
    
    return [
        {
            "id": p[0],
            "project_code": p[1],
            "project_name": p[2],
            "supplier_name": p[3],
            "amount": float(p[4]),
            "status": p[5],
            "created_by": p[6],
            "creator_name": p[7],
            "created_at": str(p[8]),
            "updated_at": str(p[9]),
            "evidence_count": p[10]
        }
        for p in projects
    ]

@router.post("", status_code=201)
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(require_role(["buyer", "admin"]))
):
    con = get_db()
    
    existing = con.execute("SELECT id FROM projects WHERE project_code = ?", [project.project_code]).fetchone()
    if existing:
        con.close()
        raise HTTPException(status_code=400, detail="项目编号已存在")
    
    max_id = con.execute("SELECT COALESCE(MAX(id), 0) FROM projects").fetchone()[0]
    new_id = max_id + 1
    
    con.execute("""
        INSERT INTO projects (id, project_code, project_name, supplier_name, amount, status, created_by)
        VALUES (?, ?, ?, ?, ?, 'draft', ?)
    """, [new_id, project.project_code, project.project_name, project.supplier_name, project.amount, current_user["id"]])
    
    max_audit_id = con.execute("SELECT COALESCE(MAX(id), 0) FROM audit_logs").fetchone()[0]
    con.execute("""
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details)
        VALUES (?, ?, 'create', 'project', ?, ?)
    """, [max_audit_id + 1, current_user["id"], new_id, f"创建项目: {project.project_name}"])
    
    con.commit()
    con.close()
    
    return {"id": new_id, "message": "项目创建成功"}

@router.get("/{project_id}")
async def get_project(
    project_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    con = get_db()
    project = con.execute("""
        SELECT p.id, p.project_code, p.project_name, p.supplier_name, p.amount,
               p.status, p.created_by, u.full_name, p.created_at, p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
    """, [project_id]).fetchone()
    
    if not project:
        con.close()
        raise HTTPException(status_code=404, detail="项目不存在")
    
    if current_user["role"] == "buyer" and project[6] != current_user["id"]:
        con.close()
        raise HTTPException(status_code=403, detail="无权访问此项目")
    
    evidence = con.execute("""
        SELECT e.id, e.file_type, e.file_name, e.file_path, e.file_size,
               e.uploaded_by, u.full_name, e.uploaded_at, e.is_archived
        FROM evidence_files e
        LEFT JOIN users u ON e.uploaded_by = u.id
        WHERE e.project_id = ?
        ORDER BY e.uploaded_at DESC
    """, [project_id]).fetchall()
    
    reviews = con.execute("""
        SELECT r.id, r.review_type, r.decision, r.comments, u.full_name, r.reviewed_at
        FROM review_records r
        LEFT JOIN users u ON r.reviewer_id = u.id
        WHERE r.project_id = ?
        ORDER BY r.reviewed_at DESC
    """, [project_id]).fetchall()
    
    con.close()
    
    return {
        "id": project[0],
        "project_code": project[1],
        "project_name": project[2],
        "supplier_name": project[3],
        "amount": float(project[4]),
        "status": project[5],
        "created_by": project[6],
        "creator_name": project[7],
        "created_at": str(project[8]),
        "updated_at": str(project[9]),
        "evidence": [
            {
                "id": e[0],
                "file_type": e[1],
                "file_name": e[2],
                "file_path": e[3],
                "file_size": e[4],
                "uploaded_by": e[5],
                "uploader_name": e[6],
                "uploaded_at": str(e[7]),
                "is_archived": e[8]
            }
            for e in evidence
        ],
        "reviews": [
            {
                "id": r[0],
                "review_type": r[1],
                "decision": r[2],
                "comments": r[3],
                "reviewer_name": r[4],
                "reviewed_at": str(r[5])
            }
            for r in reviews
        ]
    }

@router.put("/{project_id}")
async def update_project(
    project_id: int,
    project: ProjectUpdate,
    current_user: dict = Depends(require_role(["buyer", "admin"]))
):
    con = get_db()
    existing = con.execute("SELECT id, created_by, status FROM projects WHERE id = ?", [project_id]).fetchone()
    
    if not existing:
        con.close()
        raise HTTPException(status_code=404, detail="项目不存在")
    
    if existing[2] not in ["draft", "rejected"]:
        con.close()
        raise HTTPException(status_code=400, detail="项目状态不允许修改")
    
    if current_user["role"] == "buyer" and existing[1] != current_user["id"]:
        con.close()
        raise HTTPException(status_code=403, detail="无权修改此项目")
    
    update_fields = []
    params = []
    
    if project.project_name:
        update_fields.append("project_name = ?")
        params.append(project.project_name)
    if project.supplier_name:
        update_fields.append("supplier_name = ?")
        params.append(project.supplier_name)
    if project.amount is not None:
        update_fields.append("amount = ?")
        params.append(project.amount)
    
    if update_fields:
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(project_id)
        
        con.execute(f"""
            UPDATE projects SET {', '.join(update_fields)} WHERE id = ?
        """, params)
        
        audit_id = get_next_id(con, "audit_logs")
        con.execute("""
            INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details)
            VALUES (?, ?, 'update', 'project', ?, ?)
        """, [audit_id, current_user["id"], project_id, "更新项目信息"])
        
        con.commit()
    
    con.close()
    return {"message": "项目更新成功"}

@router.post("/{project_id}/submit")
async def submit_for_review(
    project_id: int,
    current_user: dict = Depends(require_role(["buyer", "admin"]))
):
    con = get_db()
    project = con.execute("SELECT id, created_by, status FROM projects WHERE id = ?", [project_id]).fetchone()
    
    if not project:
        con.close()
        raise HTTPException(status_code=404, detail="项目不存在")
    
    if current_user["role"] == "buyer" and project[1] != current_user["id"]:
        con.close()
        raise HTTPException(status_code=403, detail="无权操作此项目")
    
    if project[2] not in ["draft", "rejected"]:
        con.close()
        raise HTTPException(status_code=400, detail="项目状态不允许提交")
    
    evidence = con.execute("""
        SELECT file_type FROM evidence_files WHERE project_id = ?
    """, [project_id]).fetchall()
    
    file_types = [e[0] for e in evidence]
    
    if "supplier_quote" not in file_types:
        con.close()
        raise HTTPException(status_code=400, detail="缺少供应商报价文件，无法提交")
    
    con.execute("""
        UPDATE projects SET status = 'pending_review', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    """, [project_id])
    
    audit_id = get_next_id(con, "audit_logs")
    con.execute("""
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details)
        VALUES (?, ?, 'submit', 'project', ?, ?)
    """, [audit_id, current_user["id"], project_id, "提交审核"])
    
    con.commit()
    con.close()
    
    return {"message": "已提交审核"}
