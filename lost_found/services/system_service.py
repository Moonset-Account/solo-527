from typing import Dict, List, Tuple
from lost_found.dao.location_dao import LocationDAO, LockerDAO
from lost_found.dao.user_dao import UserDAO, SavedFilterDAO, OperationLogDAO
from lost_found.db.connection import get_connection
import csv
import json
from datetime import datetime


class LocationService:
    @staticmethod
    def list_locations(active_only: bool = True) -> List[Dict]:
        return LocationDAO.list_all(active_only=active_only)
    
    @staticmethod
    def add_location(name: str, building: str = None, floor: str = None,
                     description: str = None) -> Tuple[bool, str, int]:
        if not name or not name.strip():
            return False, "地点名称不能为空", 0
        loc_id = LocationDAO.create(name.strip(), building, floor, description)
        return True, "添加成功", loc_id


class LockerService:
    @staticmethod
    def list_lockers(status: str = None) -> List[Dict]:
        return LockerDAO.list_all(status=status)
    
    @staticmethod
    def add_locker(code: str, location_id: int = None,
                   capacity: int = 10) -> Tuple[bool, str, int]:
        if not code or not code.strip():
            return False, "保管柜编号不能为空", 0
        existing = LockerDAO.get_by_code(code.strip())
        if existing:
            return False, "保管柜编号已存在", 0
        locker_id = LockerDAO.create(code.strip(), location_id, capacity)
        return True, "添加成功", locker_id
    
    @staticmethod
    def get_locker_stats() -> Dict:
        lockers = LockerDAO.list_all()
        total = len(lockers)
        available = sum(1 for l in lockers if l['status'] == 'available')
        full = sum(1 for l in lockers if l['status'] == 'full')
        total_items = sum(l['current_count'] for l in lockers)
        total_capacity = sum(l['capacity'] for l in lockers)
        return {
            'total': total,
            'available': available,
            'full': full,
            'total_items': total_items,
            'total_capacity': total_capacity,
            'utilization': round(total_items / total_capacity * 100, 1) if total_capacity > 0 else 0
        }


class AuthService:
    @staticmethod
    def login(username: str, password: str) -> Tuple[bool, str, Dict]:
        if not username or not password:
            return False, "用户名和密码不能为空", None
        
        user = UserDAO.authenticate(username, password)
        if not user:
            return False, "用户名或密码错误", None
        
        return True, "登录成功", user
    
    @staticmethod
    def require_role(user: Dict, allowed_roles: List[str]) -> Tuple[bool, str]:
        if not user:
            return False, "请先登录"
        if user['role'] not in allowed_roles:
            return False, f"权限不足，需要角色: {', '.join(allowed_roles)}"
        return True, ""


class FilterService:
    @staticmethod
    def save_filter(user_id: int, filter_name: str, filter_type: str,
                    filter_data: Dict) -> Tuple[bool, str, int]:
        if not filter_name or not filter_name.strip():
            return False, "筛选名称不能为空", 0
        filter_id = SavedFilterDAO.save(
            user_id, filter_name.strip(), filter_type, filter_data
        )
        return True, "筛选条件已保存", filter_id
    
    @staticmethod
    def get_my_filters(user_id: int, filter_type: str = None) -> List[Dict]:
        return SavedFilterDAO.get_by_user(user_id, filter_type)
    
    @staticmethod
    def delete_filter(filter_id: int) -> Tuple[bool, str]:
        success = SavedFilterDAO.delete(filter_id)
        return (True, "删除成功") if success else (False, "删除失败")


class ExportService:
    @staticmethod
    def export_lost_items(filters: Dict = None, filepath: str = None) -> Tuple[bool, str, str]:
        from lost_found.dao.lost_item_dao import LostItemDAO
        
        items, _ = LostItemDAO.list_all(filters=filters, limit=10000, offset=0, include_sensitive=True)
        
        if not filepath:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"lost_items_export_{timestamp}.csv"
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
                if items:
                    fieldnames = [
                        'id', 'item_name', 'category', 'description', 'status',
                        'location_name', 'locker_code', 'is_valuable', 'is_sensitive',
                        'pickup_time', 'pickup_person', 'submitter_name',
                        'submitter_phone', 'remark', 'created_at'
                    ]
                    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                    writer.writeheader()
                    for item in items:
                        writer.writerow(item)
            
            return True, f"导出成功，共 {len(items)} 条记录", filepath
        except Exception as e:
            return False, f"导出失败: {str(e)}", ""
    
    @staticmethod
    def export_claim_requests(filters: Dict = None, filepath: str = None) -> Tuple[bool, str, str]:
        from lost_found.dao.claim_dao import ClaimRequestDAO
        
        requests, _ = ClaimRequestDAO.list_all(filters=filters, limit=10000, offset=0)
        
        if not filepath:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"claim_requests_export_{timestamp}.csv"
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
                if requests:
                    fieldnames = [
                        'id', 'item_name', 'claimant_name', 'claimant_phone',
                        'student_id', 'status', 'description', 'loss_time',
                        'loss_location', 'review_remark', 'created_at', 'reviewed_at'
                    ]
                    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                    writer.writeheader()
                    for req in requests:
                        writer.writerow(req)
            
            return True, f"导出成功，共 {len(requests)} 条记录", filepath
        except Exception as e:
            return False, f"导出失败: {str(e)}", ""
    
    @staticmethod
    def export_pickup_records(filters: Dict = None, filepath: str = None) -> Tuple[bool, str, str]:
        from lost_found.dao.claim_dao import PickupRecordDAO
        
        records, _ = PickupRecordDAO.list_all(filters=filters, limit=10000, offset=0)
        
        if not filepath:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"pickup_records_export_{timestamp}.csv"
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
                if records:
                    fieldnames = [
                        'id', 'item_name', 'claimant_name', 'claimant_phone',
                        'id_last4', 'handler_name', 'remark', 'pickup_time'
                    ]
                    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                    writer.writeheader()
                    for record in records:
                        writer.writerow(record)
            
            return True, f"导出成功，共 {len(records)} 条记录", filepath
        except Exception as e:
            return False, f"导出失败: {str(e)}", ""
    
    @staticmethod
    def get_stats() -> Dict:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as total FROM lost_items")
        total_items = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM lost_items WHERE status = 'storing'")
        storing = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM lost_items WHERE status = 'claimed'")
        claimed = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM lost_items WHERE status = 'returned'")
        returned = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM claim_requests WHERE status = 'pending'")
        pending_claims = cursor.fetchone()['cnt']
        
        cursor.execute("SELECT COUNT(*) as cnt FROM lost_items WHERE is_valuable = 1")
        valuable = cursor.fetchone()['cnt']
        
        return {
            'total_items': total_items,
            'storing': storing,
            'claimed': claimed,
            'returned': returned,
            'pending_claims': pending_claims,
            'valuable': valuable,
            'return_rate': round(returned / total_items * 100, 1) if total_items > 0 else 0
        }


class LogService:
    @staticmethod
    def list_logs(filters: Dict = None, page: int = 1, page_size: int = 50) -> Tuple[List[Dict], int, int]:
        offset = (page - 1) * page_size
        logs, total = OperationLogDAO.list_all(filters=filters, limit=page_size, offset=offset)
        total_pages = (total + page_size - 1) // page_size
        return logs, total, total_pages
