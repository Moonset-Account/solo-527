import duckdb
from pathlib import Path
from app.config import DB_PATH, MOCK_USERS
import uuid
from datetime import datetime, timedelta
import random

def get_db():
    conn = duckdb.connect(str(DB_PATH))
    return conn

def init_db():
    conn = get_db()
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transfer_orders (
            id VARCHAR PRIMARY KEY,
            order_no VARCHAR UNIQUE NOT NULL,
            batch_no VARCHAR,
            transfer_date DATE,
            from_warehouse VARCHAR,
            to_warehouse VARCHAR,
            amount DECIMAL(12,2),
            carrier VARCHAR,
            status VARCHAR NOT NULL DEFAULT 'DRAFT',
            created_by VARCHAR NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reviewed_by VARCHAR,
            reviewed_at TIMESTAMP,
            review_comment VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attachments (
            id VARCHAR PRIMARY KEY,
            transfer_order_id VARCHAR NOT NULL,
            type VARCHAR NOT NULL,
            file_name VARCHAR NOT NULL,
            file_path VARCHAR NOT NULL,
            file_type VARCHAR,
            file_size INTEGER,
            is_supplement BOOLEAN NOT NULL DEFAULT FALSE,
            uploaded_by VARCHAR NOT NULL,
            uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS supplement_records (
            id VARCHAR PRIMARY KEY,
            transfer_order_id VARCHAR NOT NULL,
            attachment_type VARCHAR NOT NULL,
            supplemented_by VARCHAR NOT NULL,
            supplemented_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            remark VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR PRIMARY KEY,
            transfer_order_id VARCHAR,
            action VARCHAR NOT NULL,
            old_status VARCHAR,
            new_status VARCHAR,
            operator VARCHAR NOT NULL,
            operated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            remark VARCHAR,
            filter_snapshot VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR PRIMARY KEY,
            username VARCHAR UNIQUE NOT NULL,
            password VARCHAR NOT NULL,
            role VARCHAR NOT NULL,
            full_name VARCHAR
        )
    """)
    
    for user in MOCK_USERS:
        existing = conn.execute("SELECT id FROM users WHERE username = ?", [user["username"]]).fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO users (id, username, password, role, full_name) VALUES (?, ?, ?, ?, ?)",
                [user["id"], user["username"], user["password"], user["role"], user["full_name"]]
            )
    
    result = conn.execute("SELECT COUNT(*) FROM transfer_orders").fetchone()
    if result[0] == 0:
        _seed_sample_data(conn)
    
    try:
        conn.execute("CREATE INDEX idx_transfer_status ON transfer_orders(status)")
    except:
        pass
    try:
        conn.execute("CREATE INDEX idx_transfer_batch ON transfer_orders(batch_no)")
    except:
        pass
    try:
        conn.execute("CREATE INDEX idx_attachment_order ON attachments(transfer_order_id)")
    except:
        pass
    try:
        conn.execute("CREATE INDEX idx_audit_order ON audit_logs(transfer_order_id)")
    except:
        pass
    try:
        conn.execute("CREATE INDEX idx_audit_operator ON audit_logs(operator)")
    except:
        pass
    
    conn.close()

def _seed_sample_data(conn):
    warehouses = ["北京中心仓", "上海分仓", "广州分仓", "成都分仓", "武汉分仓"]
    carriers = ["顺丰物流", "京东物流", "中通快递", "圆通速递", "德邦物流"]
    statuses = ["DRAFT", "PENDING_REVIEW", "SUPPLEMENT", "APPROVED", "REJECTED"]
    
    for i in range(1, 21):
        order_id = str(uuid.uuid4())
        order_no = f"TO{datetime.now().strftime('%Y%m')}{i:04d}"
        batch_no = f"BATCH{(i // 5) + 1:03d}"
        days_ago = random.randint(0, 30)
        transfer_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        from_wh = random.choice(warehouses)
        to_wh = random.choice([w for w in warehouses if w != from_wh])
        amount = round(random.uniform(1000, 50000), 2)
        carrier = random.choice(carriers)
        status = random.choice(statuses)
        created_by = "user1"
        
        conn.execute("""
            INSERT INTO transfer_orders 
            (id, order_no, batch_no, transfer_date, from_warehouse, to_warehouse, amount, carrier, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [order_id, order_no, batch_no, transfer_date, from_wh, to_wh, amount, carrier, status, created_by, 
              (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")])
        
        conn.execute("""
            INSERT INTO audit_logs (id, transfer_order_id, action, old_status, new_status, operator, remark)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [str(uuid.uuid4()), order_id, "CREATE", None, status, created_by, "系统生成示例数据"])
        
        if status in ["APPROVED", "REJECTED", "PENDING_REVIEW"]:
            for att_type in ["PACKING_PHOTO", "WAYBILL"]:
                conn.execute("""
                    INSERT INTO attachments (id, transfer_order_id, type, file_name, file_path, file_type, file_size, uploaded_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, [str(uuid.uuid4()), order_id, att_type, f"sample_{att_type.lower()}.jpg", 
                      f"/uploads/sample/{att_type.lower()}.jpg", "image/jpeg", 102400, "user1"])
        
        if status in ["APPROVED", "PENDING_REVIEW"]:
            conn.execute("""
                INSERT INTO attachments (id, transfer_order_id, type, file_name, file_path, file_type, file_size, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, [str(uuid.uuid4()), order_id, "RECEIPT", "sample_receipt.pdf", 
                  "/uploads/sample/receipt.pdf", "application/pdf", 204800, "user1"])
        
        if status == "APPROVED":
            conn.execute("""
                UPDATE transfer_orders SET reviewed_by = ?, reviewed_at = ?, review_comment = ? WHERE id = ?
            """, ["user2", (datetime.now() - timedelta(days=days_ago-1)).strftime("%Y-%m-%d %H:%M:%S"), "证据完整，审核通过", order_id])
            
            conn.execute("""
                INSERT INTO audit_logs (id, transfer_order_id, action, old_status, new_status, operator, remark)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [str(uuid.uuid4()), order_id, "APPROVE", "PENDING_REVIEW", "APPROVED", "user2", "证据完整，审核通过"])
