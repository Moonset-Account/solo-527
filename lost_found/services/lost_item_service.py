from typing import Dict, List, Optional, Tuple
from lost_found.dao.lost_item_dao import LostItemDAO
from lost_found.dao.location_dao import LockerDAO, LocationDAO
from lost_found.dao.user_dao import OperationLogDAO


class LostItemService:
    @staticmethod
    def register_item(item_name: str, category: str = None, description: str = None,
                      photo_path: str = None, is_sensitive: bool = False,
                      is_valuable: bool = False, pickup_location_id: int = None,
                      pickup_time: str = None, pickup_person: str = None,
                      submitter_name: str = None, submitter_phone: str = None,
                      submitter_id: int = None) -> Tuple[bool, str, Optional[int]]:
        if not item_name or not item_name.strip():
            return False, "物品名称不能为空", None
        
        if submitter_phone and not submitter_phone.strip():
            return False, "联系电话格式不正确", None
        
        try:
            item_id = LostItemDAO.create(
                item_name=item_name.strip(),
                category=category.strip() if category else None,
                description=description.strip() if description else None,
                photo_path=photo_path,
                is_sensitive=1 if is_sensitive else 0,
                is_valuable=1 if is_valuable else 0,
                pickup_location_id=pickup_location_id,
                pickup_time=pickup_time,
                pickup_person=pickup_person,
                submitter_name=submitter_name.strip() if submitter_name else None,
                submitter_phone=submitter_phone.strip() if submitter_phone else None,
                submitter_id=submitter_id
            )
            
            OperationLogDAO.create(
                user_id=submitter_id,
                operation="登记失物",
                target_type="lost_item",
                target_id=item_id,
                detail=f"登记失物: {item_name}"
            )
            
            return True, "登记成功", item_id
        except Exception as e:
            return False, f"登记失败: {str(e)}", None

    @staticmethod
    def get_item(item_id: int, include_sensitive: bool = False) -> Optional[Dict]:
        item = LostItemDAO.get_by_id(item_id)
        if item and not include_sensitive and item.get('is_sensitive'):
            item = item.copy()
            item['photo_path'] = "[敏感照片已隐藏]"
            item['description'] = "[敏感内容已隐藏]"
        return item

    @staticmethod
    def list_items(filters: Dict = None, page: int = 1, page_size: int = 20,
                   include_sensitive: bool = False) -> Tuple[List[Dict], int, int]:
        offset = (page - 1) * page_size
        items, total = LostItemDAO.list_all(filters=filters, limit=page_size, 
                                            offset=offset, include_sensitive=include_sensitive)
        
        if not include_sensitive:
            for item in items:
                if item.get('is_sensitive'):
                    item['photo_path'] = "[敏感照片已隐藏]"
                    if 'description' in item:
                        item['description'] = item['description'][:30] + "..." if item['description'] and len(item['description']) > 30 else item['description']
        
        total_pages = (total + page_size - 1) // page_size
        return items, total, total_pages

    @staticmethod
    def search_similar(keyword: str, category: str = None, limit: int = 10) -> List[Dict]:
        if not keyword or not keyword.strip():
            return []
        return LostItemDAO.search_similar(keyword.strip(), category, limit)

    @staticmethod
    def assign_locker(item_id: int, locker_id: int, handler_id: int) -> Tuple[bool, str]:
        item = LostItemDAO.get_by_id(item_id)
        if not item:
            return False, "失物不存在"
        
        if item['status'] not in ('registered',):
            return False, f"当前状态({item['status']})不允许分配保管柜"
        
        locker = LockerDAO.get_by_id(locker_id)
        if not locker:
            return False, "保管柜不存在"
        
        if locker['status'] != 'available':
            return False, f"保管柜状态为{locker['status']}，不可用"
        
        if locker['current_count'] >= locker['capacity']:
            return False, "保管柜已满"
        
        success = LostItemDAO.update_locker(item_id, locker_id, handler_id)
        if success:
            LockerDAO.update_count(locker_id, 1)
            
            OperationLogDAO.create(
                user_id=handler_id,
                operation="分配保管柜",
                target_type="lost_item",
                target_id=item_id,
                detail=f"分配保管柜 {locker['code']}"
            )
            
            return True, "保管柜分配成功"
        return False, "分配失败"

    @staticmethod
    def update_status(item_id: int, status: str, handler_id: int,
                      remark: str = None) -> Tuple[bool, str]:
        valid_statuses = ('registered', 'storing', 'claiming', 'claimed', 'returned', 'expired')
        if status not in valid_statuses:
            return False, f"无效状态: {status}"
        
        item = LostItemDAO.get_by_id(item_id)
        if not item:
            return False, "失物不存在"
        
        success = LostItemDAO.update_status(item_id, status, handler_id, remark)
        if success:
            OperationLogDAO.create(
                user_id=handler_id,
                operation="更新状态",
                target_type="lost_item",
                target_id=item_id,
                detail=f"状态更新为: {status}, 备注: {remark}"
            )
            return True, "状态更新成功"
        return False, "更新失败"

    @staticmethod
    def delete_item(item_id: int, handler_id: int) -> Tuple[bool, str]:
        item = LostItemDAO.get_by_id(item_id)
        if not item:
            return False, "失物不存在"
        
        if item.get('locker_id'):
            LockerDAO.update_count(item['locker_id'], -1)
        
        success = LostItemDAO.delete(item_id)
        if success:
            OperationLogDAO.create(
                user_id=handler_id,
                operation="删除失物",
                target_type="lost_item",
                target_id=item_id,
                detail=f"删除失物: {item['item_name']}"
            )
            return True, "删除成功"
        return False, "删除失败"
