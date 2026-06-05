from typing import List, Dict, Optional, Tuple
from lost_found.db.connection import get_connection


class ClaimantDAO:
    @staticmethod
    def create(name: str, phone: str, student_id: str = None, id_last4: str = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO claimants (name, phone, student_id, id_last4)
            VALUES (?, ?, ?, ?)
        """, (name, phone, student_id, id_last4))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_id(claimant_id: int) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM claimants WHERE id = ?", (claimant_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_by_phone(phone: str) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM claimants WHERE phone = ?", (phone,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_all(limit: int = 100, offset: int = 0) -> Tuple[List[Dict], int]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM claimants")
        total = cursor.fetchone()['total']
        cursor.execute("SELECT * FROM claimants ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset))
        rows = cursor.fetchall()
        return [dict(row) for row in rows], total

    @staticmethod
    def update(claimant_id: int, **kwargs) -> bool:
        if not kwargs:
            return False
        conn = get_connection()
        cursor = conn.cursor()
        fields = ", ".join([f"{k} = ?" for k in kwargs.keys()])
        cursor.execute(f"UPDATE claimants SET {fields} WHERE id = ?", 
                       list(kwargs.values()) + [claimant_id])
        conn.commit()
        return cursor.rowcount > 0


class ClaimRequestDAO:
    @staticmethod
    def create(lost_item_id: int, claimant_id: int, description: str = None,
               loss_time: str = None, loss_location: str = None,
               submitter_id: int = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO claim_requests 
            (lost_item_id, claimant_id, description, loss_time, loss_location, submitter_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (lost_item_id, claimant_id, description, loss_time, loss_location, submitter_id))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_id(request_id: int) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cr.*, li.item_name, li.is_valuable, li.photo_path, li.is_sensitive,
                   c.name as claimant_name, c.phone as claimant_phone, c.student_id
            FROM claim_requests cr
            JOIN lost_items li ON cr.lost_item_id = li.id
            JOIN claimants c ON cr.claimant_id = c.id
            WHERE cr.id = ?
        """, (request_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_all(filters: Dict = None, limit: int = 100, offset: int = 0) -> Tuple[List[Dict], int]:
        conn = get_connection()
        cursor = conn.cursor()
        
        conditions = []
        params = []
        
        if filters:
            if filters.get('status'):
                conditions.append("cr.status = ?")
                params.append(filters['status'])
            if filters.get('lost_item_id'):
                conditions.append("cr.lost_item_id = ?")
                params.append(filters['lost_item_id'])
            if filters.get('claimant_id'):
                conditions.append("cr.claimant_id = ?")
                params.append(filters['claimant_id'])
            if filters.get('keyword'):
                conditions.append("(li.item_name LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)")
                params.extend([f"%{filters['keyword']}%", f"%{filters['keyword']}%", f"%{filters['keyword']}%"])
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM claim_requests cr
            JOIN lost_items li ON cr.lost_item_id = li.id
            JOIN claimants c ON cr.claimant_id = c.id
            WHERE {where_clause}
        """, params)
        total = cursor.fetchone()['total']
        
        cursor.execute(f"""
            SELECT cr.*, li.item_name, li.is_valuable, li.photo_path, li.is_sensitive,
                   c.name as claimant_name, c.phone as claimant_phone, c.student_id
            FROM claim_requests cr
            JOIN lost_items li ON cr.lost_item_id = li.id
            JOIN claimants c ON cr.claimant_id = c.id
            WHERE {where_clause}
            ORDER BY cr.created_at DESC
            LIMIT ? OFFSET ?
        """, params + [limit, offset])
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows], total

    @staticmethod
    def update_status(request_id: int, status: str, reviewer_id: int = None,
                      review_remark: str = None) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE claim_requests 
            SET status = ?, reviewer_id = ?, review_remark = ?, 
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, reviewer_id, review_remark, request_id))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def get_pending_by_item(lost_item_id: int) -> List[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cr.*, c.name as claimant_name, c.phone as claimant_phone
            FROM claim_requests cr
            JOIN claimants c ON cr.claimant_id = c.id
            WHERE cr.lost_item_id = ? AND cr.status = 'pending'
            ORDER BY cr.created_at
        """, (lost_item_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


class ProofMaterialDAO:
    @staticmethod
    def create(claim_request_id: int, material_type: str, material_path: str = None,
               description: str = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO proof_materials (claim_request_id, material_type, material_path, description)
            VALUES (?, ?, ?, ?)
        """, (claim_request_id, material_type, material_path, description))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_claim_request(claim_request_id: int) -> List[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM proof_materials 
            WHERE claim_request_id = ?
            ORDER BY uploaded_at
        """, (claim_request_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


class ClaimVerificationDAO:
    @staticmethod
    def create(claim_request_id: int, verifier_id: int, verification_result: str,
               remark: str = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO claim_verifications (claim_request_id, verifier_id, verification_result, remark)
            VALUES (?, ?, ?, ?)
        """, (claim_request_id, verifier_id, verification_result, remark))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_claim_request(claim_request_id: int) -> List[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cv.*, u.name as verifier_name
            FROM claim_verifications cv
            LEFT JOIN users u ON cv.verifier_id = u.id
            WHERE cv.claim_request_id = ?
            ORDER BY cv.verified_at
        """, (claim_request_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


class PickupRecordDAO:
    @staticmethod
    def create(claim_request_id: int, claimant_id: int, id_last4: str = None,
               handler_id: int = None, signature_path: str = None,
               remark: str = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO pickup_records 
            (claim_request_id, claimant_id, id_last4, handler_id, signature_path, remark)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (claim_request_id, claimant_id, id_last4, handler_id, signature_path, remark))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_id(record_id: int) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT pr.*, c.name as claimant_name, c.phone as claimant_phone,
                   li.item_name, u.name as handler_name
            FROM pickup_records pr
            JOIN claimants c ON pr.claimant_id = c.id
            JOIN claim_requests cr ON pr.claim_request_id = cr.id
            JOIN lost_items li ON cr.lost_item_id = li.id
            LEFT JOIN users u ON pr.handler_id = u.id
            WHERE pr.id = ?
        """, (record_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_all(filters: Dict = None, limit: int = 100, offset: int = 0) -> Tuple[List[Dict], int]:
        conn = get_connection()
        cursor = conn.cursor()
        
        conditions = []
        params = []
        
        if filters:
            if filters.get('keyword'):
                conditions.append("(li.item_name LIKE ? OR c.name LIKE ?)")
                params.extend([f"%{filters['keyword']}%", f"%{filters['keyword']}%"])
            if filters.get('start_date'):
                conditions.append("pr.pickup_time >= ?")
                params.append(filters['start_date'])
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM pickup_records pr
            JOIN claimants c ON pr.claimant_id = c.id
            JOIN claim_requests cr ON pr.claim_request_id = cr.id
            JOIN lost_items li ON cr.lost_item_id = li.id
            WHERE {where_clause}
        """, params)
        total = cursor.fetchone()['total']
        
        cursor.execute(f"""
            SELECT pr.*, c.name as claimant_name, c.phone as claimant_phone,
                   li.item_name, u.name as handler_name
            FROM pickup_records pr
            JOIN claimants c ON pr.claimant_id = c.id
            JOIN claim_requests cr ON pr.claim_request_id = cr.id
            JOIN lost_items li ON cr.lost_item_id = li.id
            LEFT JOIN users u ON pr.handler_id = u.id
            WHERE {where_clause}
            ORDER BY pr.pickup_time DESC
            LIMIT ? OFFSET ?
        """, params + [limit, offset])
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows], total
