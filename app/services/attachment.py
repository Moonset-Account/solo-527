import uuid
import shutil
from pathlib import Path
from app.database import get_db
from app.config import UPLOAD_DIR
from app.utils.file_validator import validate_file
from app.services.audit import log_action
from datetime import datetime

def upload_attachment(
    transfer_order_id: str,
    attachment_type: str,
    file,
    uploaded_by: str,
    is_supplement: bool = False
) -> dict:
    file_content = file.file.read()
    file_size = len(file_content)
    
    valid, error_msg = validate_file(file.filename, file_size, attachment_type)
    if not valid:
        raise ValueError(error_msg)
    
    conn = get_db()
    try:
        order_dir = UPLOAD_DIR / transfer_order_id
        order_dir.mkdir(parents=True, exist_ok=True)
        
        ext = Path(file.filename).suffix.lower()
        stored_filename = f"{attachment_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = order_dir / stored_filename
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        attachment_id = str(uuid.uuid4())
        relative_path = f"/uploads/{transfer_order_id}/{stored_filename}"
        
        conn.execute("""
            INSERT INTO attachments 
            (id, transfer_order_id, type, file_name, file_path, file_type, file_size, is_supplement, uploaded_by, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            attachment_id, transfer_order_id, attachment_type,
            file.filename, relative_path, file.content_type,
            file_size, is_supplement, uploaded_by,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ])
        conn.commit()
        
        if is_supplement:
            conn.execute("""
                INSERT INTO supplement_records 
                (id, transfer_order_id, attachment_type, supplemented_by, supplemented_at, remark)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                str(uuid.uuid4()), transfer_order_id, attachment_type,
                uploaded_by, datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "人工补证"
            ])
            conn.commit()
            
            log_action(
                transfer_order_id=transfer_order_id,
                action="SUPPLEMENT",
                operator=uploaded_by,
                remark=f"补证{attachment_type}"
            )
        else:
            log_action(
                transfer_order_id=transfer_order_id,
                action="UPLOAD",
                operator=uploaded_by,
                remark=f"上传{attachment_type}"
            )
        
        return get_attachment(attachment_id)
    finally:
        conn.close()

def get_attachment(attachment_id: str) -> dict:
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM attachments WHERE id = ?", [attachment_id]).fetchone()
        if not row:
            return None
        columns = [desc[0] for desc in conn.description]
        return dict(zip(columns, row))
    finally:
        conn.close()

def get_attachments_by_order(transfer_order_id: str) -> list[dict]:
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM attachments WHERE transfer_order_id = ? ORDER BY uploaded_at DESC",
            [transfer_order_id]
        ).fetchall()
        columns = [desc[0] for desc in conn.description]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()

def get_supplement_records(transfer_order_id: str) -> list[dict]:
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM supplement_records WHERE transfer_order_id = ? ORDER BY supplemented_at DESC",
            [transfer_order_id]
        ).fetchall()
        columns = [desc[0] for desc in conn.description]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()
