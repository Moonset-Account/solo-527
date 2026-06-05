from typing import List, Dict, Optional, Tuple
from lost_found.db.connection import get_connection


class LostItemDAO:
    @staticmethod
    def create(item_name: str, category: str = None, description: str = None,
               photo_path: str = None, is_sensitive: int = 0, is_valuable: int = 0,
               pickup_location_id: int = None, pickup_time: str = None,
               pickup_person: str = None, locker_id: int = None,
               submitter_name: str = None, submitter_phone: str = None,
               submitter_id: int = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO lost_items 
            (item_name, category, description, photo_path, is_sensitive, is_valuable,
             pickup_location_id, pickup_time, pickup_person, locker_id,
             submitter_name, submitter_phone, submitter_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (item_name, category, description, photo_path, is_sensitive, is_valuable,
              pickup_location_id, pickup_time, pickup_person, locker_id,
              submitter_name, submitter_phone, submitter_id))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_id(item_id: int) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT li.*, l.name as location_name, lk.code as locker_code
            FROM lost_items li
            LEFT JOIN locations l ON li.pickup_location_id = l.id
            LEFT JOIN lockers lk ON li.locker_id = lk.id
            WHERE li.id = ?
        """, (item_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_all(filters: Dict = None, limit: int = 100, offset: int = 0,
                 include_sensitive: bool = False) -> Tuple[List[Dict], int]:
        conn = get_connection()
        cursor = conn.cursor()
        
        conditions = []
        params = []
        
        if filters:
            if filters.get('status'):
                conditions.append("li.status = ?")
                params.append(filters['status'])
            if filters.get('category'):
                conditions.append("li.category LIKE ?")
                params.append(f"%{filters['category']}%")
            if filters.get('keyword'):
                conditions.append("(li.item_name LIKE ? OR li.description LIKE ?)")
                params.extend([f"%{filters['keyword']}%", f"%{filters['keyword']}%"])
            if filters.get('is_valuable') is not None:
                conditions.append("li.is_valuable = ?")
                params.append(1 if filters['is_valuable'] else 0)
            if filters.get('location_id'):
                conditions.append("li.pickup_location_id = ?")
                params.append(filters['location_id'])
            if filters.get('start_date'):
                conditions.append("li.created_at >= ?")
                params.append(filters['start_date'])
            if filters.get('end_date'):
                conditions.append("li.created_at <= ?")
                params.append(filters['end_date'])
        
        if not include_sensitive:
            conditions.append("li.is_sensitive = 0")
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM lost_items li
            WHERE {where_clause}
        """, params)
        total = cursor.fetchone()['total']
        
        cursor.execute(f"""
            SELECT li.*, l.name as location_name, lk.code as locker_code
            FROM lost_items li
            LEFT JOIN locations l ON li.pickup_location_id = l.id
            LEFT JOIN lockers lk ON li.locker_id = lk.id
            WHERE {where_clause}
            ORDER BY li.created_at DESC
            LIMIT ? OFFSET ?
        """, params + [limit, offset])
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows], total

    @staticmethod
    def update_status(item_id: int, status: str, handler_id: int = None, remark: str = None) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE lost_items 
            SET status = ?, handler_id = ?, remark = COALESCE(?, remark), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, handler_id, remark, item_id))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def update_locker(item_id: int, locker_id: int, handler_id: int = None) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE lost_items 
            SET locker_id = ?, status = 'storing', handler_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (locker_id, handler_id, item_id))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def search_similar(keyword: str, category: str = None, limit: int = 10) -> List[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        
        conditions = ["(li.status IN ('registered', 'storing'))"]
        params = []
        
        if keyword:
            conditions.append("(li.item_name LIKE ? OR li.description LIKE ?)")
            params.extend([f"%{keyword}%", f"%{keyword}%"])
        if category:
            conditions.append("li.category LIKE ?")
            params.append(f"%{category}%")
        
        where_clause = " AND ".join(conditions)
        
        cursor.execute(f"""
            SELECT li.*, l.name as location_name
            FROM lost_items li
            LEFT JOIN locations l ON li.pickup_location_id = l.id
            WHERE {where_clause}
            AND li.is_sensitive = 0
            ORDER BY li.created_at DESC
            LIMIT ?
        """, params + [limit])
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def delete(item_id: int) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM lost_items WHERE id = ?", (item_id,))
        conn.commit()
        return cursor.rowcount > 0
