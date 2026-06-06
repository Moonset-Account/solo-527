import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth_utils import get_current_active_user, require_role
from database import get_db, get_next_id
from datetime import datetime

router = APIRouter()
THRESHOLD_AMOUNT = float(os.getenv("THRESHOLD_AMOUNT", "50000"))

class ReviewCreate(BaseModel):
    decision: str
    comments: Optional[str] = None

def get_threshold_amount():
    return THRESHOLD_AMOUNT

@router.get("/pending")
async def get_pending_reviews(
    current_user: dict = Depends(require_role(["auditor", "admin"]))
):
    con = get_db()
    
    projects = con.execute("""
        SELECT p.id, p.project_code, p.project_name, p.supplier_name, p.amount,
               p.status, u.full_name, p.created_at,
               (SELECT COUNT(*) FROM review_records r WHERE r.project_id = p.id AND r.review_type = 'first_review') as first_review_done,
               (SELECT COUNT(*) FROM review_records r WHERE r.project_id = p.id AND r.review_type = 'second_review') as second_review_done
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.status IN ('pending_review', 'first_reviewed')
        ORDER BY p.created_at DESC
    """).fetchall()
    
    con.close()
    
    threshold = get_threshold_amount()
    
    return {
        "threshold_amount": threshold,
        "items": [
            {
                "id": p[0],
                "project_code": p[1],
                "project_name": p[2],
                "supplier_name": p[3],
                "amount": float(p[4]),
                "status": p[5],
                "creator_name": p[6],
                "created_at": str(p[7]),
                "needs_second_review": float(p[4]) > threshold,
                "first_review_done": p[8] > 0,
                "second_review_done": p[9] > 0
            }
            for p in projects
        ]
    }

@router.post("/{project_id}/{review_type}")
async def review_project(
    project_id: int,
    review_type: str,
    review: ReviewCreate,
    current_user: dict = Depends(require_role(["auditor", "admin"]))
):
    if review_type not in ["first_review", "second_review"]:
        raise HTTPException(status_code=400, detail="无效的审核类型")
    
    if review.decision not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="无效的决策")
    
    con = get_db()
    
    project = con.execute("""
        SELECT id, project_code, project_name, amount, status, created_by
        FROM projects WHERE id = ?
    """, [project_id]).fetchone()
    
    if not project:
        con.close()
        raise HTTPException(status_code=404, detail="项目不存在")
    
    threshold = get_threshold_amount()
    amount = float(project[3])
    needs_second = amount > threshold
    
    if review_type == "first_review":
        if project[4] != "pending_review":
            con.close()
            raise HTTPException(status_code=400, detail="项目不在待一审状态")
        
        existing = con.execute("""
            SELECT id FROM review_records WHERE project_id = ? AND review_type = 'first_review'
        """, [project_id]).fetchone()
        if existing:
            con.close()
            raise HTTPException(status_code=400, detail="该项目已完成一审")
    
    elif review_type == "second_review":
        if not needs_second:
            con.close()
            raise HTTPException(status_code=400, detail="该项目金额未超过阈值，无需二审")
        
        if project[4] != "first_reviewed":
            con.close()
            raise HTTPException(status_code=400, detail="项目不在待二审状态")
        
        existing = con.execute("""
            SELECT id FROM review_records WHERE project_id = ? AND review_type = 'second_review'
        """, [project_id]).fetchone()
        if existing:
            con.close()
            raise HTTPException(status_code=400, detail="该项目已完成二审")
    
    if review.decision == "approve":
        evidence = con.execute("""
            SELECT file_type FROM evidence_files WHERE project_id = ?
        """, [project_id]).fetchall()
        file_types = [e[0] for e in evidence]
        
        if "supplier_quote" not in file_types:
            con.close()
            raise HTTPException(status_code=400, detail="供应商报价文件缺失，不能通过审核，只能退回补证")
    
    review_id = get_next_id(con, "review_records")
    con.execute("""
        INSERT INTO review_records (id, project_id, reviewer_id, review_type, decision, comments)
        VALUES (?, ?, ?, ?, ?, ?)
    """, [review_id, project_id, current_user["id"], review_type, review.decision, review.comments])
    
    if review.decision == "approve":
        if review_type == "first_review":
            if needs_second:
                new_status = "first_reviewed"
            else:
                new_status = "archived"
                con.execute("""
                    UPDATE evidence_files SET is_archived = TRUE WHERE project_id = ?
                """, [project_id])
        else:
            new_status = "archived"
            con.execute("""
                UPDATE evidence_files SET is_archived = TRUE WHERE project_id = ?
            """, [project_id])
    else:
        new_status = "rejected"
    
    con.execute("""
        UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    """, [new_status, project_id])
    
    notification_msg = ""
    if review.decision == "approve":
        if review_type == "first_review" and needs_second:
            notification_msg = f"项目 {project[1]} 一审通过，等待二审"
        elif review_type == "second_review" or (review_type == "first_review" and not needs_second):
            notification_msg = f"项目 {project[1]} 已完成审核并归档"
    else:
        notification_msg = f"项目 {project[1]} 被退回，请补充材料"
    
    notification_id = get_next_id(con, "notifications")
    con.execute("""
        INSERT INTO notifications (id, user_id, project_id, notification_type, message, next_retry_at)
        VALUES (?, ?, ?, 'review', ?, CURRENT_TIMESTAMP)
    """, [notification_id, project[5], project_id, notification_msg])
    
    audit_id = get_next_id(con, "audit_logs")
    con.execute("""
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details)
        VALUES (?, ?, 'review', 'project', ?, ?)
    """, [audit_id, current_user["id"], project_id, f"{review_type}: {review.decision} - {review.comments or ''}"])
    
    con.commit()
    con.close()
    
    return {"message": "审核完成", "new_status": new_status}

@router.get("/threshold")
async def get_threshold(
    current_user: dict = Depends(get_current_active_user)
):
    return {"threshold_amount": get_threshold_amount()}

@router.get("/rejected")
async def get_rejected_projects(
    current_user: dict = Depends(get_current_active_user)
):
    con = get_db()
    query = """
        SELECT p.id, p.project_code, p.project_name, p.supplier_name, p.amount,
               u.full_name, p.updated_at,
               (SELECT r.comments FROM review_records r 
                WHERE r.project_id = p.id AND r.decision = 'reject'
                ORDER BY r.reviewed_at DESC LIMIT 1) as reject_reason
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.status = 'rejected'
    """
    params = []
    
    if current_user["role"] == "buyer":
        query += " AND p.created_by = ?"
        params.append(current_user["id"])
    
    query += " ORDER BY p.updated_at DESC"
    
    projects = con.execute(query, params).fetchall()
    con.close()
    
    return [
        {
            "id": p[0],
            "project_code": p[1],
            "project_name": p[2],
            "supplier_name": p[3],
            "amount": float(p[4]),
            "creator_name": p[5],
            "rejected_at": str(p[6]),
            "reject_reason": p[7]
        }
        for p in projects
    ]
