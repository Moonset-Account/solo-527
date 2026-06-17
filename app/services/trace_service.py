from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import and_, func, case
from sqlalchemy.orm import Session
from ..models import User, Order, Satisfaction, DeliveryNode
from ..schemas import (
    SatisfactionTraceFilter, SatisfactionStats,
    OrderStatus, PaginationResult
)


class TraceService:
    def __init__(self, db: Session):
        self.db = db

    def get_satisfaction_stats(
        self, filter_params: SatisfactionTraceFilter, current_user: User
    ) -> SatisfactionStats:
        query = self.db.query(Satisfaction).join(Order).join(
            User, Order.photographer_id == User.id
        )
        
        if filter_params.exclude_test_data:
            query = query.filter(
                and_(
                    Order.is_test_data == False,
                    User.is_test_account == False
                )
            )
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        if filter_params.photographer_id:
            query = query.filter(Order.photographer_id == filter_params.photographer_id)
        
        if filter_params.start_date:
            query = query.filter(Satisfaction.created_at >= filter_params.start_date)
        if filter_params.end_date:
            query = query.filter(Satisfaction.created_at <= filter_params.end_date)
        
        if filter_params.min_rating:
            query = query.filter(Satisfaction.rating >= filter_params.min_rating)
        if filter_params.max_rating:
            query = query.filter(Satisfaction.rating <= filter_params.max_rating)
        
        if filter_params.order_status:
            query = query.filter(Order.status == filter_params.order_status)
        
        total_orders = query.count()
        avg_rating = query.with_entities(func.avg(Satisfaction.rating)).scalar() or 0.0
        
        rating_dist = {}
        for rating in range(1, 6):
            count = query.filter(Satisfaction.rating == rating).count()
            rating_dist[str(rating)] = count
        
        by_photographer_query = query.with_entities(
            User.id,
            User.real_name,
            func.count(Satisfaction.id).label("total"),
            func.avg(Satisfaction.rating).label("avg_rating")
        ).group_by(User.id, User.real_name).all()
        
        by_photographer = [
            {
                "photographer_id": row[0],
                "photographer_name": row[1],
                "total_orders": row[2],
                "avg_rating": float(row[3] or 0)
            }
            for row in by_photographer_query
        ]
        
        date_trunc = func.date_trunc('day', Satisfaction.created_at)
        by_date_query = query.with_entities(
            date_trunc.label("date"),
            func.count(Satisfaction.id).label("total"),
            func.avg(Satisfaction.rating).label("avg_rating")
        ).group_by(date_trunc).order_by(date_trunc.desc()).limit(30).all()
        
        by_date = [
            {
                "date": row[0].strftime("%Y-%m-%d"),
                "total_orders": row[1],
                "avg_rating": float(row[2] or 0)
            }
            for row in by_date_query
        ]
        
        by_status_query = query.with_entities(
            Order.status,
            func.count(Satisfaction.id).label("total"),
            func.avg(Satisfaction.rating).label("avg_rating")
        ).group_by(Order.status).all()
        
        status_names = {
            "pending": "待处理",
            "shooting": "拍摄中",
            "selecting": "选片中",
            "selected": "已选片",
            "editing": "精修中",
            "delivered": "已交付",
            "confirmed": "已确认",
            "completed": "已完成",
            "cancelled": "已取消"
        }
        
        by_status = [
            {
                "status": row[0],
                "status_name": status_names.get(row[0], row[0]),
                "total_orders": row[1],
                "avg_rating": float(row[2] or 0)
            }
            for row in by_status_query
        ]
        
        return SatisfactionStats(
            total_orders=total_orders,
            avg_rating=round(float(avg_rating), 2),
            rating_distribution=rating_dist,
            by_photographer=by_photographer,
            by_date=by_date,
            by_status=by_status
        )

    def get_satisfaction_details(
        self, filter_params: SatisfactionTraceFilter, current_user: User,
        page: int = 1,
        page_size: int = 20
    ) -> PaginationResult[dict]:
        query = self.db.query(Satisfaction, Order, User).join(
            Order, Satisfaction.order_id == Order.id
        ).join(
            User, Order.photographer_id == User.id
        )
        
        if filter_params.exclude_test_data:
            query = query.filter(
                and_(
                    Order.is_test_data == False,
                    User.is_test_account == False
                )
            )
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        if filter_params.photographer_id:
            query = query.filter(Order.photographer_id == filter_params.photographer_id)
        
        if filter_params.start_date:
            query = query.filter(Satisfaction.created_at >= filter_params.start_date)
        if filter_params.end_date:
            query = query.filter(Satisfaction.created_at <= filter_params.end_date)
        
        if filter_params.min_rating:
            query = query.filter(Satisfaction.rating >= filter_params.min_rating)
        if filter_params.max_rating:
            query = query.filter(Satisfaction.rating <= filter_params.max_rating)
        
        if filter_params.order_status:
            query = query.filter(Order.status == filter_params.order_status)
        
        total = query.count()
        offset = (page - 1) * page_size
        results = query.order_by(Satisfaction.created_at.desc()).offset(offset).limit(page_size).all()
        
        items = []
        for satisfaction, order, photographer in results:
            items.append({
                "id": satisfaction.id,
                "order_id": order.id,
                "order_no": order.order_no,
                "customer_name": order.customer_name,
                "shoot_type": order.shoot_type,
                "photographer_id": photographer.id,
                "photographer_name": photographer.real_name,
                "rating": satisfaction.rating,
                "feedback": satisfaction.feedback,
                "order_status": order.status,
                "total_amount": float(order.total_amount),
                "rated_at": satisfaction.created_at
            })
        
        return PaginationResult(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    def get_delivery_trace(
        self, order_id: Optional[int] = None,
        photographer_id: Optional[int] = None,
        node_type: Optional[str] = None,
        is_completed: Optional[bool] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        current_user: User = None,
        page: int = 1,
        page_size: int = 20
    ) -> PaginationResult[dict]:
        query = self.db.query(DeliveryNode, Order, User).join(
            Order, DeliveryNode.order_id == Order.id
        ).join(
            User, DeliveryNode.operator_id == User.id, isouter=True
        )
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        if order_id:
            query = query.filter(DeliveryNode.order_id == order_id)
        if photographer_id:
            query = query.filter(Order.photographer_id == photographer_id)
        if node_type:
            query = query.filter(DeliveryNode.node_type == node_type)
        if is_completed is not None:
            query = query.filter(DeliveryNode.is_completed == is_completed)
        if start_date:
            query = query.filter(DeliveryNode.expected_at >= start_date)
        if end_date:
            query = query.filter(DeliveryNode.expected_at <= end_date)
        
        total = query.count()
        offset = (page - 1) * page_size
        results = query.order_by(DeliveryNode.expected_at.desc()).offset(offset).limit(page_size).all()
        
        items = []
        for node, order, operator in results:
            delay_days = None
            if node.is_completed and node.actual_at and node.expected_at:
                delay = (node.actual_at - node.expected_at).total_seconds() / 86400
                delay_days = round(delay, 1)
            
            items.append({
                "id": node.id,
                "order_id": order.id,
                "order_no": order.order_no,
                "customer_name": order.customer_name,
                "photographer_id": order.photographer_id,
                "node_type": node.node_type,
                "node_name": node.node_name,
                "expected_at": node.expected_at,
                "actual_at": node.actual_at,
                "is_completed": node.is_completed,
                "operator_name": operator.real_name if operator else None,
                "delay_days": delay_days,
                "remark": node.remark
            })
        
        return PaginationResult(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    def get_overall_stats(self, current_user: User) -> dict:
        order_query = self.db.query(Order)
        satisfaction_query = self.db.query(Satisfaction).join(Order)
        
        if not current_user.is_test_account:
            order_query = order_query.filter(Order.is_test_data == False)
            satisfaction_query = satisfaction_query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            order_query = order_query.filter(Order.photographer_id == current_user.id)
            satisfaction_query = satisfaction_query.filter(Order.photographer_id == current_user.id)
        
        total_orders = order_query.count()
        completed_orders = order_query.filter(Order.status == OrderStatus.COMPLETED).count()
        
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        current_month_orders = order_query.filter(
            Order.created_at >= current_month
        ).count()
        
        last_month_orders = order_query.filter(
            and_(
                Order.created_at >= last_month,
                Order.created_at < current_month
            )
        ).count()
        
        current_month_revenue = order_query.filter(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.created_at >= current_month
            )
        ).with_entities(func.sum(Order.total_amount)).scalar() or 0
        
        avg_satisfaction = satisfaction_query.with_entities(
            func.avg(Satisfaction.rating)
        ).scalar() or 0
        
        node_query = self.db.query(DeliveryNode).join(Order)
        if not current_user.is_test_account:
            node_query = node_query.filter(Order.is_test_data == False)
        if current_user.role == "photographer":
            node_query = node_query.filter(Order.photographer_id == current_user.id)
        
        on_time_nodes = node_query.filter(
            and_(
                DeliveryNode.is_completed == True,
                DeliveryNode.actual_at <= DeliveryNode.expected_at
            )
        ).count()
        
        total_completed_nodes = node_query.filter(DeliveryNode.is_completed == True).count()
        on_time_rate = round(on_time_nodes / total_completed_nodes * 100, 2) if total_completed_nodes > 0 else 0
        
        return {
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "completion_rate": round(completed_orders / total_orders * 100, 2) if total_orders > 0 else 0,
            "current_month_orders": current_month_orders,
            "last_month_orders": last_month_orders,
            "month_over_month_growth": round(
                (current_month_orders - last_month_orders) / last_month_orders * 100, 2
            ) if last_month_orders > 0 else 0,
            "current_month_revenue": float(current_month_revenue),
            "avg_satisfaction": round(float(avg_satisfaction), 2),
            "on_time_delivery_rate": on_time_rate,
            "total_completed_nodes": total_completed_nodes,
            "on_time_nodes": on_time_nodes
        }
