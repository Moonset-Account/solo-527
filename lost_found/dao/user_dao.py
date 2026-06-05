from typing import List, Dict, Optional
from lost_found.db.connection import get_connection
import json


class UserDAO:
    @staticmethod
    def authenticate(username: str, password: str) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM users 
            WHERE username = ? AND password_hash = ?
        """, (username, password))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_by_id(user_id: int) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_all(role: str = None) -> List[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT id, username, name, role, created_at FROM users"
        params = []
        if role:
            query += " WHERE role = ?"
            params.append(role)
        query += " ORDER BY id"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def create(username: str, password: str, role: str, name: str = None,
               phone: str = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (username, password_hash, role, name, phone)
            VALUES (?, ?, ?, ?, ?)
        """, (username, password, role, name, phone))
        conn.commit()
        return cursor.lastrowid


class SavedFilterDAO:
    @staticmethod
    def save(user_id: int, filter_name: str, filter_type: str, filter_data: Dict) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO saved_filters (user_id, filter_name, filter_type, filter_data)
            VALUES (?, ?, ?, ?)
        """, (user_id, filter_name, filter_type, json.dumps(filter_data, ensure_ascii=False)))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_user(user_id: int, filter_type: str = None) -> List[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM saved_filters WHERE user_id = ?"
        params = [user_id]
        if filter_type:
            query += " AND filter_type = ?"
            params.append(filter_type)
        query += " ORDER BY created_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        results = []
        for row in rows:
            row_dict = dict(row)
            row_dict['filter_data'] = json.loads(row_dict['filter_data'])
            results.append(row_dict)
        return results

    @staticmethod
    def delete(filter_id: int) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_filters WHERE id = ?", (filter_id,))
        conn.commit()
        return cursor.rowcount > 0


class OperationLogDAO:
    @staticmethod
    def create(user_id: int, operation: str, target_type: str = None,
               target_id: int = None, detail: str = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO operation_logs (user_id, operation, target_type, target_id, detail)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, operation, target_type, target_id, detail))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def list_all(filters: Dict = None, limit: int = 100, offset: int = 0) -> tuple:
        conn = get_connection()
        cursor = conn.cursor()
        
        conditions = []
        params = []
        
        if filters:
            if filters.get('user_id'):
                conditions.append("ol.user_id = ?")
                params.append(filters['user_id'])
            if filters.get('operation'):
                conditions.append("ol.operation LIKE ?")
                params.append(f"%{filters['operation']}%")
            if filters.get('target_type'):
                conditions.append("ol.target_type = ?")
                params.append(filters['target_type'])
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        cursor.execute(f"SELECT COUNT(*) as total FROM operation_logs ol WHERE {where_clause}", params)
        total = cursor.fetchone()['total']
        
        cursor.execute(f"""
            SELECT ol.*, u.name as user_name
            FROM operation_logs ol
            LEFT JOIN users u ON ol.user_id = u.id
            WHERE {where_clause}
            ORDER BY ol.created_at DESC
            LIMIT ? OFFSET ?
        """, params + [limit, offset])
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows], total
