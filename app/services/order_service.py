from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models import Order, User, DeliveryNode, PhotoSelection, DeliveryFile
from ..schemas import (
    OrderCreate, OrderUpdate, OrderStatus, OrderListFilter,
    DeliveryNodeCreate, DeliveryNodeType, PaginationResult
)


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, order_data: OrderCreate, current_user: User) -> Order:
        order = Order(**order_data.model_dump())
        order.is_test_data = current_user.is_test_account
        self.db.add(order)
        self.db.flush()
        self._create_default_nodes(order)
        self._create_photo_selections(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def _create_default_nodes(self, order: Order):
        node_configs = [
            (DeliveryNodeType.SHOOT_COMPLETE, "拍摄完成", order.shoot_date + timedelta(hours=8)),
            (DeliveryNodeType.SELECT_CONFIRM, "选片确认", order.shoot_date + timedelta(days=3)),
            (DeliveryNodeType.EDIT_START, "开始精修", order.shoot_date + timedelta(days=4)),
            (DeliveryNodeType.FIRST_DRAFT, "初版交付", order.shoot_date + timedelta(days=10)),
            (DeliveryNodeType.FINAL_DELIVER, "最终交付", order.shoot_date + timedelta(days=15)),
            (DeliveryNodeType.CUSTOMER_CONFIRM, "客户确认", order.shoot_date + timedelta(days=17)),
        ]
        for node_type, node_name, expected_at in node_configs:
            node = DeliveryNode(
                order_id=order.id,
                node_type=node_type,
                node_name=node_name,
                expected_at=expected_at
            )
            self.db.add(node)

    def _create_photo_selections(self, order: Order):
        for i in range(order.photo_count):
            photo_key = f"{order.order_no}_{i+1:04d}"
            selection = PhotoSelection(
                order_id=order.id,
                photo_key=photo_key,
                thumbnail_url=f"/static/images/placeholder_{(i%5)+1}.jpg",
                original_url=f"/static/originals/{photo_key}.jpg"
            )
            self.db.add(selection)

    def get_order(self, order_id: int, current_user: User) -> Optional[Order]:
        query = self.db.query(Order).filter(Order.id == order_id)
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        return query.first()

    def list_orders(
        self, filter_params: OrderListFilter, current_user: User
    ) -> PaginationResult:
        query = self.db.query(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        if filter_params.status:
            query = query.filter(Order.status == filter_params.status)
        
        if filter_params.photographer_id and current_user.role == "admin":
            query = query.filter(Order.photographer_id == filter_params.photographer_id)
        
        if filter_params.start_date:
            query = query.filter(Order.shoot_date >= filter_params.start_date)
        
        if filter_params.end_date:
            query = query.filter(Order.shoot_date <= filter_params.end_date)
        
        if filter_params.keyword:
            query = query.filter(
                or_(
                    Order.order_no.ilike(f"%{filter_params.keyword}%"),
                    Order.customer_name.ilike(f"%{filter_params.keyword}%"),
                    Order.customer_phone.ilike(f"%{filter_params.keyword}%")
                )
            )
        
        total = query.count()
        offset = (filter_params.page - 1) * filter_params.page_size
        items = query.order_by(Order.created_at.desc()).offset(offset).limit(filter_params.page_size).all()
        
        return PaginationResult(
            items=items,
            total=total,
            page=filter_params.page,
            page_size=filter_params.page_size,
            total_pages=(total + filter_params.page_size - 1) // filter_params.page_size
        )

    def update_order(self, order_id: int, update_data: OrderUpdate, current_user: User) -> Order:
        order = self.get_order(order_id, current_user)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        if current_user.role not in ["admin"] and order.photographer_id != current_user.id:
            raise HTTPException(status_code=403, detail="无权修改此订单")
        
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(order, field, value)
        
        order.updated_at = datetime.now()
        self.db.commit()
        self.db.refresh(order)
        return order

    def update_order_status(self, order_id: int, new_status: OrderStatus, current_user: User) -> Order:
        order = self.get_order(order_id, current_user)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        order.status = new_status
        order.updated_at = datetime.now()
        
        self._complete_node(order, new_status, current_user)
        
        self.db.commit()
        self.db.refresh(order)
        return order

    def _complete_node(self, order: Order, status: OrderStatus, current_user: User):
        node_type_map = {
            OrderStatus.SHOOTING: DeliveryNodeType.SHOOT_COMPLETE,
            OrderStatus.SELECTING: DeliveryNodeType.SELECT_CONFIRM,
            OrderStatus.EDITING: DeliveryNodeType.EDIT_START,
            OrderStatus.DELIVERED: DeliveryNodeType.FINAL_DELIVER,
            OrderStatus.CONFIRMED: DeliveryNodeType.CUSTOMER_CONFIRM,
        }
        
        node_type = node_type_map.get(status)
        if node_type:
            node = self.db.query(DeliveryNode).filter(
                and_(
                    DeliveryNode.order_id == order.id,
                    DeliveryNode.node_type == node_type
                )
            ).first()
            if node and not node.is_completed:
                node.is_completed = True
                node.actual_at = datetime.now()
                node.operator_id = current_user.id

    def get_photo_selections(self, order_id: int, current_user: User) -> List[PhotoSelection]:
        order = self.get_order(order_id, current_user)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        return self.db.query(PhotoSelection).filter(
            PhotoSelection.order_id == order_id
        ).order_by(PhotoSelection.photo_key).all()

    def update_photo_selection(
        self, order_id: int, photo_id: int, is_selected: bool, 
        selection_note: Optional[str], current_user: User
    ) -> PhotoSelection:
        order = self.get_order(order_id, current_user)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        selection = self.db.query(PhotoSelection).filter(
            and_(
                PhotoSelection.id == photo_id,
                PhotoSelection.order_id == order_id
            )
        ).first()
        
        if not selection:
            raise HTTPException(status_code=404, detail="照片不存在")
        
        selection.is_selected = is_selected
        selection.selection_note = selection_note
        selection.selected_at = datetime.now() if is_selected else None
        selection.selected_by = current_user.id if is_selected else None
        
        selected_count = self.db.query(PhotoSelection).filter(
            and_(
                PhotoSelection.order_id == order_id,
                PhotoSelection.is_selected == True
            )
        ).count()
        order.selected_count = selected_count
        
        if order.status == OrderStatus.PENDING:
            order.status = OrderStatus.SELECTING
        
        self.db.commit()
        self.db.refresh(selection)
        return selection

    def batch_update_photo_selections(
        self, order_id: int, photo_ids: List[int], is_selected: bool,
        selection_note: Optional[str], current_user: User
    ) -> Tuple[int, int]:
        order = self.get_order(order_id, current_user)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        updated_count = 0
        for photo_id in photo_ids:
            selection = self.db.query(PhotoSelection).filter(
                and_(
                    PhotoSelection.id == photo_id,
                    PhotoSelection.order_id == order_id
                )
            ).first()
            if selection:
                selection.is_selected = is_selected
                selection.selection_note = selection_note
                selection.selected_at = datetime.now() if is_selected else None
                selection.selected_by = current_user.id if is_selected else None
                updated_count += 1
        
        selected_count = self.db.query(PhotoSelection).filter(
            and_(
                PhotoSelection.order_id == order_id,
                PhotoSelection.is_selected == True
            )
        ).count()
        order.selected_count = selected_count
        
        if order.status == OrderStatus.PENDING:
            order.status = OrderStatus.SELECTING
        
        self.db.commit()
        return updated_count, selected_count

    def confirm_selection(self, order_id: int, current_user: User) -> Order:
        order = self.get_order(order_id, current_user)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        if order.selected_count == 0:
            raise HTTPException(status_code=400, detail="请至少选择一张照片")
        
        order.status = OrderStatus.SELECTED
        order.updated_at = datetime.now()
        
        self._complete_node(order, OrderStatus.SELECTING, current_user)
        
        self.db.commit()
        self.db.refresh(order)
        return order

    def get_delivery_files(self, order_id: int, current_user: User) -> List[DeliveryFile]:
        order = self.get_order(order_id, current_user)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        return self.db.query(DeliveryFile).filter(
            DeliveryFile.order_id == order_id
        ).order_by(DeliveryFile.uploaded_at.desc()).all()

    def mark_file_downloaded(self, file_id: int, current_user: User) -> DeliveryFile:
        file = self.db.query(DeliveryFile).filter(DeliveryFile.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="文件不存在")
        
        order = self.get_order(file.order_id, current_user)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        file.is_downloaded = True
        file.download_count += 1
        file.last_downloaded_at = datetime.now()
        
        all_downloaded = self.db.query(DeliveryFile).filter(
            and_(
                DeliveryFile.order_id == file.order_id,
                DeliveryFile.is_downloaded == False
            )
        ).count() == 0
        
        if all_downloaded and order.status == OrderStatus.DELIVERED:
            order.delivered_count = self.db.query(DeliveryFile).filter(
                DeliveryFile.order_id == file.order_id
            ).count()
        
        self.db.commit()
        self.db.refresh(file)
        return file

    def get_dashboard_stats(self, current_user: User) -> dict:
        query = self.db.query(Order)
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        stats = {
            "pending_orders": query.filter(Order.status == OrderStatus.PENDING).count(),
            "selecting_orders": query.filter(Order.status == OrderStatus.SELECTING).count(),
            "delivering_orders": query.filter(Order.status.in_([
                OrderStatus.EDITING, OrderStatus.DELIVERED
            ])).count(),
            "completed_orders": query.filter(Order.status == OrderStatus.COMPLETED).count(),
        }
        
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0)
        monthly_revenue = query.filter(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.created_at >= current_month
            )
        ).with_entities(func.sum(Order.total_amount)).scalar() or 0
        
        stats["monthly_revenue"] = float(monthly_revenue)
        
        return stats
