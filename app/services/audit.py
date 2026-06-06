import uuid
from app.database import get_db
from datetime import datetime

def log_action(
    transfer_order_id: str = None,
    action: str = "",
    old_status: str = None,
    new_status: str = None,
    operator: str = "",
    remark: str = None,
    filter_snapshot: str = None
):
    conn = get_db()
    try:
        conn.execute("""
            INSERT INTO audit_logs 
            (id, transfer_order_id, action, old_status, new_status, operator, operated_at, remark, filter_snapshot)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            str(uuid.uuid4()),
            transfer_order_id,
            action,
            old_status,
            new_status,
            operator,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            remark,
            filter_snapshot
        ])
        conn.commit()
    finally:
        conn.close()

def get_audit_logs(
    transfer_order_id: str = None,
    operator: str = None,
    action: str = None,
    date_from: str = None,
    date_to: str = None,
    limit: int = 100,
    offset: int = 0
) -> tuple[list[dict], int]:
    conn = get_db()
    try:
        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []
        
        if transfer_order_id:
            query += " AND transfer_order_id = ?"
            params.append(transfer_order_id)
        if operator:
            query += " AND operator = ?"
            params.append(operator)
        if action:
            query += " AND action = ?"
            params.append(action)
        if date_from:
            query += " AND operated_at >= ?"
            params.append(date_from)
        if date_to:
            query += " AND operated_at <= ?"
            params.append(date_to + " 23:59:59")
        
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        total = conn.execute(count_query, params).fetchone()[0]
        
        query += " ORDER BY operated_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        rows = conn.execute(query, params).fetchall()
        columns = [desc[0] for desc in conn.description]
        
        result = []
        for row in rows:
            result.append(dict(zip(columns, row)))
        
        return result, total
    finally:
        conn.close()

ACTION_NAMES = {
    "CREATE": "创建",
    "UPLOAD": "上传附件",
    "SUPPLEMENT": "补证",
    "SUBMIT": "提交复核",
    "APPROVE": "复核通过",
    "REJECT": "复核驳回",
    "EXPORT": "导出",
    "LOGIN": "登录",
}
