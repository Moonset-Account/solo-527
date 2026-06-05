from typing import Dict, List, Optional, Tuple
from lost_found.dao.claim_dao import (
    ClaimantDAO, ClaimRequestDAO, ProofMaterialDAO,
    ClaimVerificationDAO, PickupRecordDAO
)
from lost_found.dao.lost_item_dao import LostItemDAO
from lost_found.dao.location_dao import LockerDAO
from lost_found.dao.user_dao import OperationLogDAO


class ClaimService:
    @staticmethod
    def submit_claim(lost_item_id: int, claimant_name: str, claimant_phone: str,
                     description: str = None, loss_time: str = None,
                     loss_location: str = None, student_id: str = None,
                     submitter_id: int = None) -> Tuple[bool, str, Optional[int]]:
        if not claimant_name or not claimant_name.strip():
            return False, "认领人姓名不能为空", None
        
        if not claimant_phone or not claimant_phone.strip():
            return False, "联系电话不能为空", None
        
        item = LostItemDAO.get_by_id(lost_item_id)
        if not item:
            return False, "失物不存在", None
        
        if item['status'] in ('claimed', 'returned'):
            return False, "该物品已被认领", None
        
        existing_claimant = ClaimantDAO.get_by_phone(claimant_phone)
        if existing_claimant:
            claimant_id = existing_claimant['id']
            if student_id:
                ClaimantDAO.update(claimant_id, student_id=student_id)
        else:
            claimant_id = ClaimantDAO.create(
                name=claimant_name.strip(),
                phone=claimant_phone.strip(),
                student_id=student_id.strip() if student_id else None
            )
        
        pending_requests = ClaimRequestDAO.get_pending_by_item(lost_item_id)
        for req in pending_requests:
            if req['claimant_id'] == claimant_id:
                return False, "您已提交过该物品的认领申请，请等待审核", None
        
        request_id = ClaimRequestDAO.create(
            lost_item_id=lost_item_id,
            claimant_id=claimant_id,
            description=description.strip() if description else None,
            loss_time=loss_time,
            loss_location=loss_location.strip() if loss_location else None,
            submitter_id=submitter_id
        )
        
        LostItemDAO.update_status(lost_item_id, 'claiming', handler_id=None)
        
        OperationLogDAO.create(
            user_id=submitter_id,
            operation="提交认领申请",
            target_type="claim_request",
            target_id=request_id,
            detail=f"申请认领: {item['item_name']}"
        )
        
        return True, "认领申请提交成功", request_id

    @staticmethod
    def add_proof_material(claim_request_id: int, material_type: str,
                           material_path: str = None, description: str = None,
                           user_id: int = None) -> Tuple[bool, str, Optional[int]]:
        valid_types = ('id_card', 'student_card', 'purchase_proof', 'photo', 'other')
        if material_type not in valid_types:
            return False, f"无效的证明材料类型: {material_type}", None
        
        request = ClaimRequestDAO.get_by_id(claim_request_id)
        if not request:
            return False, "认领申请不存在", None
        
        if request['status'] not in ('pending',):
            return False, f"当前状态({request['status']})不允许添加证明材料", None
        
        material_id = ProofMaterialDAO.create(
            claim_request_id=claim_request_id,
            material_type=material_type,
            material_path=material_path,
            description=description
        )
        
        OperationLogDAO.create(
            user_id=user_id,
            operation="添加证明材料",
            target_type="proof_material",
            target_id=material_id,
            detail=f"材料类型: {material_type}"
        )
        
        return True, "证明材料添加成功", material_id

    @staticmethod
    def review_claim(claim_request_id: int, approved: bool, reviewer_id: int,
                     review_remark: str = None) -> Tuple[bool, str]:
        request = ClaimRequestDAO.get_by_id(claim_request_id)
        if not request:
            return False, "认领申请不存在"
        
        if request['status'] != 'pending':
            return False, f"当前状态({request['status']})不允许审核"
        
        status = 'approved' if approved else 'rejected'
        success = ClaimRequestDAO.update_status(
            claim_request_id, status, reviewer_id, review_remark
        )
        
        if success:
            if approved:
                LostItemDAO.update_status(
                    request['lost_item_id'], 'claimed', handler_id=reviewer_id
                )
                op_detail = f"审核通过: {request['item_name']}"
            else:
                pending_count = len(ClaimRequestDAO.get_pending_by_item(request['lost_item_id']))
                if pending_count <= 1:
                    LostItemDAO.update_status(
                        request['lost_item_id'], 'storing', handler_id=reviewer_id
                    )
                op_detail = f"审核拒绝: {request['item_name']}, 原因: {review_remark}"
            
            ClaimVerificationDAO.create(
                claim_request_id=claim_request_id,
                verifier_id=reviewer_id,
                verification_result='passed' if approved else 'failed',
                remark=review_remark
            )
            
            OperationLogDAO.create(
                user_id=reviewer_id,
                operation="审核认领申请",
                target_type="claim_request",
                target_id=claim_request_id,
                detail=op_detail
            )
            
            return True, "审核完成"
        return False, "审核失败"

    @staticmethod
    def withdraw_claim(claim_request_id: int, user_id: int = None) -> Tuple[bool, str]:
        request = ClaimRequestDAO.get_by_id(claim_request_id)
        if not request:
            return False, "认领申请不存在"
        
        if request['status'] not in ('pending', 'approved'):
            return False, f"当前状态({request['status']})不允许撤回"
        
        success = ClaimRequestDAO.update_status(
            claim_request_id, 'withdrawn', reviewer_id=user_id,
            review_remark="用户撤回申请"
        )
        
        if success:
            pending_count = len(ClaimRequestDAO.get_pending_by_item(request['lost_item_id']))
            if pending_count <= 1:
                LostItemDAO.update_status(
                    request['lost_item_id'], 'storing', handler_id=user_id
                )
            
            OperationLogDAO.create(
                user_id=user_id,
                operation="撤回认领申请",
                target_type="claim_request",
                target_id=claim_request_id,
                detail=f"撤回申请: {request['item_name']}"
            )
            
            return True, "撤回成功"
        return False, "撤回失败"

    @staticmethod
    def confirm_pickup(claim_request_id: int, handler_id: int,
                       id_last4: str = None, remark: str = None) -> Tuple[bool, str]:
        request = ClaimRequestDAO.get_by_id(claim_request_id)
        if not request:
            return False, "认领申请不存在"
        
        if request['status'] != 'approved':
            return False, f"当前状态({request['status']})不允许领取"
        
        if request['is_valuable'] and (not id_last4 or len(str(id_last4)) != 4):
            return False, "贵重物品领取必须登记证件后四位"
        
        if id_last4:
            ClaimantDAO.update(request['claimant_id'], id_last4=str(id_last4))
        
        PickupRecordDAO.create(
            claim_request_id=claim_request_id,
            claimant_id=request['claimant_id'],
            id_last4=str(id_last4) if id_last4 else None,
            handler_id=handler_id,
            remark=remark
        )
        
        ClaimRequestDAO.update_status(
            claim_request_id, 'completed', reviewer_id=handler_id,
            review_remark="已领取"
        )
        
        LostItemDAO.update_status(
            request['lost_item_id'], 'returned', handler_id=handler_id
        )
        
        item = LostItemDAO.get_by_id(request['lost_item_id'])
        if item and item.get('locker_id'):
            LockerDAO.update_count(item['locker_id'], -1)
        
        OperationLogDAO.create(
            user_id=handler_id,
            operation="确认领取",
            target_type="claim_request",
            target_id=claim_request_id,
            detail=f"领取确认: {request['item_name']}"
        )
        
        return True, "领取核销成功"

    @staticmethod
    def get_claim_request(request_id: int, include_sensitive: bool = False) -> Optional[Dict]:
        request = ClaimRequestDAO.get_by_id(request_id)
        if request and not include_sensitive and request.get('is_sensitive'):
            request = request.copy()
            request['photo_path'] = "[敏感照片已隐藏]"
        return request

    @staticmethod
    def list_claim_requests(filters: Dict = None, page: int = 1,
                            page_size: int = 20) -> Tuple[List[Dict], int, int]:
        offset = (page - 1) * page_size
        requests, total = ClaimRequestDAO.list_all(
            filters=filters, limit=page_size, offset=offset
        )
        total_pages = (total + page_size - 1) // page_size
        return requests, total, total_pages

    @staticmethod
    def list_pickup_records(filters: Dict = None, page: int = 1,
                            page_size: int = 20) -> Tuple[List[Dict], int, int]:
        offset = (page - 1) * page_size
        records, total = PickupRecordDAO.list_all(
            filters=filters, limit=page_size, offset=offset
        )
        total_pages = (total + page_size - 1) // page_size
        return records, total, total_pages

    @staticmethod
    def get_proof_materials(claim_request_id: int) -> List[Dict]:
        return ProofMaterialDAO.get_by_claim_request(claim_request_id)

    @staticmethod
    def get_verification_records(claim_request_id: int) -> List[Dict]:
        return ClaimVerificationDAO.get_by_claim_request(claim_request_id)
