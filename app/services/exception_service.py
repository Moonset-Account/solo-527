from datetime import datetime
from typing import List, Optional
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import User, ExceptionTicket, ExceptionLog, Order
from ..schemas import (
    ExceptionTicketCreate, ExceptionTicketUpdate, ExceptionStatus,
    ExceptionType, PaginationResult
)


class ExceptionService:
    def __init__(self, db: Session):
        self.db = db

    def create_exception(self, exception_data: ExceptionTicketCreate, current_user: User) -> ExceptionTicket:
        order = self.db.query(Order).filter(Order.id == exception_data.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        ticket = ExceptionTicket(**exception_data.model_dump())
        self.db.add(ticket)
        self.db.flush()
        
        log = ExceptionLog(
            ticket_id=ticket.id,
            action="创建异常工单",
            remark=f"由 {current_user.name} 创建",
            operator_id=current_user.id
        )
        self.db.add(log)
        
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def get_exception(self, ticket_id: int, current_user: User) -> Optional[ExceptionTicket]:
        query = self.db.query(ExceptionTicket).filter(ExceptionTicket.id == ticket_id)
        
        if not current_user.is_test_account:
            query = query.join(Order).filter(Order.is_test_data == False)
        
        if current_user.role == "video_lead":
            query = query.filter(
                or_(
                    ExceptionTicket.assignee_id == current_user.id,
                    ExceptionTicket.assignee_id.is_(None)
                )
            )
        
        return query.first()

    def list_exceptions(
        self, current_user: User,
        exception_type: Optional[ExceptionType] = None,
        status: Optional[ExceptionStatus] = None,
        assignee_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> PaginationResult:
        query = self.db.query(ExceptionTicket).join(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "video_lead":
            query = query.filter(
                or_(
                    ExceptionTicket.assignee_id == current_user.id,
                    ExceptionTicket.assignee_id.is_(None)
                )
            )
        
        if exception_type:
            query = query.filter(ExceptionTicket.exception_type == exception_type)
        if status:
            query = query.filter(ExceptionTicket.status == status)
        if assignee_id and current_user.role == "admin":
            query = query.filter(ExceptionTicket.assignee_id == assignee_id)
        if start_date:
            query = query.filter(ExceptionTicket.created_at >= start_date)
        if end_date:
            query = query.filter(ExceptionTicket.created_at <= end_date)
        if keyword:
            query = query.filter(
                or_(
                    ExceptionTicket.title.ilike(f"%{keyword}%"),
                    ExceptionTicket.description.ilike(f"%{keyword}%")
                )
            )
        
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(ExceptionTicket.created_at.desc()).offset(offset).limit(page_size).all()
        
        return PaginationResult(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    def update_exception(
        self, ticket_id: int, update_data: ExceptionTicketUpdate, current_user: User
    ) -> ExceptionTicket:
        ticket = self.get_exception(ticket_id, current_user)
        if not ticket:
            raise HTTPException(status_code=404, detail="异常工单不存在")
        
        if current_user.role not in ["admin"] and ticket.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="无权处理此工单")
        
        old_status = ticket.status
        
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(ticket, field, value)
        
        ticket.updated_at = datetime.now()
        
        if update_data.resolution and update_data.status == ExceptionStatus.RESOLVED:
            ticket.resolved_at = datetime.now()
            ticket.resolved_by = current_user.id
        
        action_map = {
            "assignee_id": "分配处理人",
            "status": f"状态变更: {old_status} -> {update_data.status}",
            "resolution": "填写处理结果"
        }
        
        for field in update_data.model_dump(exclude_unset=True).keys():
            if field in action_map:
                log = ExceptionLog(
                    ticket_id=ticket.id,
                    action=action_map[field],
                    operator_id=current_user.id
                )
                self.db.add(log)
        
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def process_exception(
        self, ticket_id: int, resolution: str, current_user: User
    ) -> ExceptionTicket:
        ticket = self.get_exception(ticket_id, current_user)
        if not ticket:
            raise HTTPException(status_code=404, detail="异常工单不存在")
        
        if ticket.assignee_id and ticket.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="无权处理此工单")
        
        if ticket.status == ExceptionStatus.PENDING:
            ticket.status = ExceptionStatus.PROCESSING
            
            log = ExceptionLog(
                ticket_id=ticket.id,
                action="开始处理",
                operator_id=current_user.id
            )
            self.db.add(log)
        
        ticket.resolution = resolution
        ticket.status = ExceptionStatus.RESOLVED
        ticket.resolved_at = datetime.now()
        ticket.resolved_by = current_user.id
        ticket.updated_at = datetime.now()
        
        log = ExceptionLog(
            ticket_id=ticket.id,
            action="处理完成",
            remark=f"处理结果: {resolution}",
            operator_id=current_user.id
        )
        self.db.add(log)
        
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def close_exception(self, ticket_id: int, current_user: User) -> ExceptionTicket:
        ticket = self.get_exception(ticket_id, current_user)
        if not ticket:
            raise HTTPException(status_code=404, detail="异常工单不存在")
        
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="只有管理员可以关闭工单")
        
        if ticket.status != ExceptionStatus.RESOLVED:
            raise HTTPException(status_code=400, detail="只有已解决的工单才能关闭")
        
        ticket.status = ExceptionStatus.CLOSED
        ticket.updated_at = datetime.now()
        
        log = ExceptionLog(
            ticket_id=ticket.id,
            action="关闭工单",
            operator_id=current_user.id
        )
        self.db.add(log)
        
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def get_exception_logs(self, ticket_id: int, current_user: User) -> List[ExceptionLog]:
        ticket = self.get_exception(ticket_id, current_user)
        if not ticket:
            raise HTTPException(status_code=404, detail="异常工单不存在")
        
        return self.db.query(ExceptionLog).filter(
            ExceptionLog.ticket_id == ticket_id
        ).order_by(ExceptionLog.created_at.desc()).all()

    def get_exception_stats(self, current_user: User) -> dict:
        query = self.db.query(ExceptionTicket).join(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "video_lead":
            query = query.filter(
                or_(
                    ExceptionTicket.assignee_id == current_user.id,
                    ExceptionTicket.assignee_id.is_(None)
                )
            )
        
        stats = {
            "total": query.count(),
            "pending": query.filter(ExceptionTicket.status == ExceptionStatus.PENDING).count(),
            "processing": query.filter(ExceptionTicket.status == ExceptionStatus.PROCESSING).count(),
            "resolved": query.filter(ExceptionTicket.status == ExceptionStatus.RESOLVED).count(),
            "closed": query.filter(ExceptionTicket.status == ExceptionStatus.CLOSED).count(),
        }
        
        type_stats = {}
        for et in ExceptionType:
            count = query.filter(ExceptionTicket.exception_type == et).count()
            if count > 0:
                type_stats[et.value] = count
        stats["by_type"] = type_stats
        
        total_amount_diff = query.filter(
            ExceptionTicket.amount_diff != 0
        ).with_entities(func.sum(ExceptionTicket.amount_diff)).scalar() or 0
        stats["total_amount_diff"] = float(total_amount_diff)
        
        return stats

    def auto_detect_exceptions(self) -> List[ExceptionTicket]:
        detected = []
        
        orders = self.db.query(Order).filter(
            and_(
                Order.status.in_([
                    "completed", "confirmed", "delivered"
                ]),
                Order.is_test_data == False
            )
        ).all()
        
        for order in orders:
            if order.total_amount > 0 and order.prepaid_amount < order.total_amount:
                existing = self.db.query(ExceptionTicket).filter(
                    and_(
                        ExceptionTicket.order_id == order.id,
                        ExceptionTicket.exception_type == ExceptionType.PRICE_DIFF,
                        ExceptionTicket.status.in_(["pending", "processing"])
                    )
                ).first()
                
                if not existing:
                    ticket = ExceptionTicket(
                        order_id=order.id,
                        exception_type=ExceptionType.PRICE_DIFF,
                        title=f"订单 {order.order_no} 结算差异",
                        description=f"订单金额 {order.total_amount} 与已收款 {order.prepaid_amount} 存在差异",
                        amount_diff=order.total_amount - order.prepaid_amount,
                        status=ExceptionStatus.PENDING
                    )
                    self.db.add(ticket)
                    detected.append(ticket)
        
        self.db.commit()
        return detected
