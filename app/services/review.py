from app.database import get_db
from app.services.transfer import get_transfer_order, check_evidence_complete
from app.services.audit import log_action
from app.config import ATTACHMENT_TYPE_NAMES
from datetime import datetime

def approve_order(order_id: str, operator: str, comment: str = None) -> dict:
    conn = get_db()
    try:
        order = get_transfer_order(order_id)
        if not order:
            raise ValueError("调拨单不存在")
        if order["status"] != "PENDING_REVIEW":
            raise ValueError("只有待复核状态的单据可以审核")
        
        complete, missing = check_evidence_complete(order_id)
        if not complete:
            missing_names = [ATTACHMENT_TYPE_NAMES.get(t, t) for t in missing]
            raise ValueError(f"证据不完整，缺少: {', '.join(missing_names)}")
        
        old_status = order["status"]
        
        conn.execute("""
            UPDATE transfer_orders 
            SET status = 'APPROVED', reviewed_by = ?, reviewed_at = ?, review_comment = ?
            WHERE id = ?
        """, [
            operator,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            comment or "审核通过",
            order_id
        ])
        conn.commit()
        
        log_action(
            transfer_order_id=order_id,
            action="APPROVE",
            old_status=old_status,
            new_status="APPROVED",
            operator=operator,
            remark=comment or "审核通过"
        )
        
        return get_transfer_order(order_id)
    finally:
        conn.close()

def reject_order(order_id: str, operator: str, comment: str = None) -> dict:
    conn = get_db()
    try:
        order = get_transfer_order(order_id)
        if not order:
            raise ValueError("调拨单不存在")
        if order["status"] != "PENDING_REVIEW":
            raise ValueError("只有待复核状态的单据可以审核")
        
        old_status = order["status"]
        
        conn.execute("""
            UPDATE transfer_orders 
            SET status = 'REJECTED', reviewed_by = ?, reviewed_at = ?, review_comment = ?
            WHERE id = ?
        """, [
            operator,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            comment or "审核驳回",
            order_id
        ])
        conn.commit()
        
        log_action(
            transfer_order_id=order_id,
            action="REJECT",
            old_status=old_status,
            new_status="REJECTED",
            operator=operator,
            remark=comment or "审核驳回"
        )
        
        return get_transfer_order(order_id)
    finally:
        conn.close()

def get_pending_review_orders(limit: int = 50, offset: int = 0) -> tuple[list[dict], int]:
    conn = get_db()
    try:
        total = conn.execute(
            "SELECT COUNT(*) FROM transfer_orders WHERE status = 'PENDING_REVIEW'"
        ).fetchone()[0]
        
        rows = conn.execute("""
            SELECT * FROM transfer_orders 
            WHERE status = 'PENDING_REVIEW'
            ORDER BY created_at ASC
            LIMIT ? OFFSET ?
        """, [limit, offset]).fetchall()
        
        columns = [desc[0] for desc in conn.description]
        result = [dict(zip(columns, row)) for row in rows]
        
        return result, total
    finally:
        conn.close()
