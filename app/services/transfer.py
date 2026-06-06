import uuid
from app.database import get_db
from app.models import TransferOrderCreate, FilterParams
from datetime import datetime
from app.services.audit import log_action

def create_transfer_order(data: TransferOrderCreate, created_by: str) -> dict:
    conn = get_db()
    try:
        order_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO transfer_orders 
            (id, order_no, batch_no, transfer_date, from_warehouse, to_warehouse, amount, carrier, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)
        """, [
            order_id, data.order_no, data.batch_no, 
            data.transfer_date.isoformat() if data.transfer_date else None,
            data.from_warehouse, data.to_warehouse,
            float(data.amount) if data.amount else None,
            data.carrier, created_by,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ])
        conn.commit()
        
        log_action(
            transfer_order_id=order_id,
            action="CREATE",
            new_status="DRAFT",
            operator=created_by,
            remark="创建调拨单"
        )
        
        return get_transfer_order(order_id)
    finally:
        conn.close()

def get_transfer_order(order_id: str) -> dict:
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM transfer_orders WHERE id = ?", [order_id]).fetchone()
        if not row:
            return None
        columns = [desc[0] for desc in conn.description]
        return dict(zip(columns, row))
    finally:
        conn.close()

def get_transfer_orders(
    filters: FilterParams = None,
    user_role: str = None,
    user_id: str = None,
    limit: int = 50,
    offset: int = 0
) -> tuple[list[dict], int]:
    conn = get_db()
    try:
        query = "SELECT * FROM transfer_orders WHERE 1=1"
        params = []
        
        if user_role == "WATCHER" and user_id:
            query += " AND created_by = ?"
            params.append(user_id)
        
        if user_role == "FINANCE":
            query += " AND status = 'APPROVED'"
        
        if filters:
            if filters.status:
                query += " AND status = ?"
                params.append(filters.status)
            if filters.batch_no:
                query += " AND batch_no LIKE ?"
                params.append(f"%{filters.batch_no}%")
            if filters.from_warehouse:
                query += " AND from_warehouse = ?"
                params.append(filters.from_warehouse)
            if filters.to_warehouse:
                query += " AND to_warehouse = ?"
                params.append(filters.to_warehouse)
            if filters.date_from:
                query += " AND transfer_date >= ?"
                params.append(filters.date_from.isoformat())
            if filters.date_to:
                query += " AND transfer_date <= ?"
                params.append(filters.date_to.isoformat())
            if filters.keyword:
                query += " AND (order_no LIKE ? OR batch_no LIKE ?)"
                params.extend([f"%{filters.keyword}%", f"%{filters.keyword}%"])
        
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        total = conn.execute(count_query, params).fetchone()[0]
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        rows = conn.execute(query, params).fetchall()
        columns = [desc[0] for desc in conn.description]
        
        result = []
        for row in rows:
            result.append(dict(zip(columns, row)))
        
        return result, total
    finally:
        conn.close()

def check_evidence_complete(order_id: str) -> tuple[bool, list[str]]:
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT DISTINCT type FROM attachments WHERE transfer_order_id = ?",
            [order_id]
        ).fetchall()
        existing_types = [r[0] for r in rows]
        
        required = ["PACKING_PHOTO", "WAYBILL", "RECEIPT"]
        missing = []
        
        for t in required:
            if t not in existing_types:
                missing.append(t)
        
        return len(missing) == 0, missing
    finally:
        conn.close()

def submit_for_review(order_id: str, operator: str) -> dict:
    complete, missing = check_evidence_complete(order_id)
    if not complete:
        from app.config import ATTACHMENT_TYPE_NAMES
        missing_names = [ATTACHMENT_TYPE_NAMES.get(m, m) for m in missing]
        raise ValueError(f"缺少必需附件: {', '.join(missing_names)}，无法提交复核")
    
    conn = get_db()
    try:
        order = get_transfer_order(order_id)
        old_status = order["status"]
        
        conn.execute("""
            UPDATE transfer_orders SET status = 'PENDING_REVIEW' WHERE id = ?
        """, [order_id])
        conn.commit()
        
        log_action(
            transfer_order_id=order_id,
            action="SUBMIT",
            old_status=old_status,
            new_status="PENDING_REVIEW",
            operator=operator,
            remark="提交复核"
        )
        
        return get_transfer_order(order_id)
    finally:
        conn.close()

def get_batch_map() -> list[dict]:
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT batch_no, 
                   COUNT(*) as total_count,
                   SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_count,
                   SUM(CASE WHEN status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending_count,
                   SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
                   SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
                   SUM(amount) as total_amount
            FROM transfer_orders
            WHERE batch_no IS NOT NULL
            GROUP BY batch_no
            ORDER BY batch_no
        """).fetchall()
        columns = [desc[0] for desc in conn.description]
        
        result = []
        for row in rows:
            result.append(dict(zip(columns, row)))
        
        return result
    finally:
        conn.close()
