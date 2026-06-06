from app.database import get_db
from app.utils.excel import export_to_excel
from app.services.audit import log_action
from app.config import FINANCE_FIELDS
from io import BytesIO

def get_settlement_orders(
    status: str = "APPROVED",
    date_from: str = None,
    date_to: str = None,
    keyword: str = None,
    limit: int = 100,
    offset: int = 0
) -> tuple[list[dict], int]:
    conn = get_db()
    try:
        query = """
            SELECT DISTINCT t.* FROM transfer_orders t
            WHERE t.status = ?
            AND EXISTS (SELECT 1 FROM attachments a WHERE a.transfer_order_id = t.id AND a.type = 'PACKING_PHOTO')
            AND EXISTS (SELECT 1 FROM attachments a WHERE a.transfer_order_id = t.id AND a.type = 'WAYBILL')
            AND EXISTS (SELECT 1 FROM attachments a WHERE a.transfer_order_id = t.id AND a.type = 'RECEIPT')
        """
        params = [status]
        
        if date_from:
            query += " AND transfer_date >= ?"
            params.append(date_from)
        if date_to:
            query += " AND transfer_date <= ?"
            params.append(date_to)
        if keyword:
            query += " AND (order_no LIKE ? OR batch_no LIKE ?)"
            params.extend([f"%{keyword}%", f"%{keyword}%"])
        
        count_query = """
            SELECT COUNT(DISTINCT t.id) FROM transfer_orders t
            WHERE t.status = ?
            AND EXISTS (SELECT 1 FROM attachments a WHERE a.transfer_order_id = t.id AND a.type = 'PACKING_PHOTO')
            AND EXISTS (SELECT 1 FROM attachments a WHERE a.transfer_order_id = t.id AND a.type = 'WAYBILL')
            AND EXISTS (SELECT 1 FROM attachments a WHERE a.transfer_order_id = t.id AND a.type = 'RECEIPT')
        """
        count_params = [status]
        
        if date_from:
            count_query += " AND transfer_date >= ?"
            count_params.append(date_from)
        if date_to:
            count_query += " AND transfer_date <= ?"
            count_params.append(date_to)
        if keyword:
            count_query += " AND (order_no LIKE ? OR batch_no LIKE ?)"
            count_params.extend([f"%{keyword}%", f"%{keyword}%"])
        
        total = conn.execute(count_query, count_params).fetchone()[0]
        
        query += " ORDER BY reviewed_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        rows = conn.execute(query, params).fetchall()
        columns = [desc[0] for desc in conn.description]
        
        result = []
        for row in rows:
            full_row = dict(zip(columns, row))
            filtered_row = {k: full_row[k] for k in FINANCE_FIELDS if k in full_row}
            result.append(filtered_row)
        
        return result, total
    finally:
        conn.close()

def export_settlement_excel(
    operator: str,
    status: str = "APPROVED",
    date_from: str = None,
    date_to: str = None,
    keyword: str = None
) -> BytesIO:
    orders, _ = get_settlement_orders(
        status=status,
        date_from=date_from,
        date_to=date_to,
        keyword=keyword,
        limit=10000,
        offset=0
    )
    
    import json
    filter_snapshot = json.dumps({
        "status": status,
        "date_from": date_from,
        "date_to": date_to,
        "keyword": keyword
    }, ensure_ascii=False)
    
    log_action(
        action="EXPORT",
        operator=operator,
        remark=f"导出对账数据，共{len(orders)}条记录",
        filter_snapshot=filter_snapshot
    )
    
    return export_to_excel(orders, is_finance=True)
