from typing import List, Dict, Optional
from lost_found.db.connection import get_connection


class LocationDAO:
    @staticmethod
    def create(name: str, building: str = None, floor: str = None, description: str = None) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO locations (name, building, floor, description)
            VALUES (?, ?, ?, ?)
        """, (name, building, floor, description))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_id(location_id: int) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM locations WHERE id = ?", (location_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_all(active_only: bool = True) -> List[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM locations"
        if active_only:
            query += " WHERE is_active = 1"
        query += " ORDER BY name"
        cursor.execute(query)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def update(location_id: int, **kwargs) -> bool:
        if not kwargs:
            return False
        conn = get_connection()
        cursor = conn.cursor()
        fields = ", ".join([f"{k} = ?" for k in kwargs.keys()])
        cursor.execute(f"UPDATE locations SET {fields} WHERE id = ?", 
                       list(kwargs.values()) + [location_id])
        conn.commit()
        return cursor.rowcount > 0


class LockerDAO:
    @staticmethod
    def create(code: str, location_id: int = None, capacity: int = 10) -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO lockers (code, location_id, capacity)
            VALUES (?, ?, ?)
        """, (code, location_id, capacity))
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_id(locker_id: int) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT lk.*, l.name as location_name
            FROM lockers lk
            LEFT JOIN locations l ON lk.location_id = l.id
            WHERE lk.id = ?
        """, (locker_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_by_code(code: str) -> Optional[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lockers WHERE code = ?", (code,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_all(status: str = None) -> List[Dict]:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT lk.*, l.name as location_name
            FROM lockers lk
            LEFT JOIN locations l ON lk.location_id = l.id
        """
        params = []
        if status:
            query += " WHERE lk.status = ?"
            params.append(status)
        query += " ORDER BY lk.code"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def update_count(locker_id: int, delta: int) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE lockers 
            SET current_count = current_count + ?
            WHERE id = ?
        """, (delta, locker_id))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def update_status(locker_id: int, status: str) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE lockers SET status = ? WHERE id = ?", (status, locker_id))
        conn.commit()
        return cursor.rowcount > 0
