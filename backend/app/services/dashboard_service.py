from datetime import datetime, timedelta, date
from typing import Dict, Any, List
from collections import defaultdict
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.adoption import AdoptionApplication
from app.models.follow_up import FollowUpTask
from app.models.schedule import Schedule
from app.models.pet import Pet
from app.models.customer import Customer


class DashboardService:
    @staticmethod
    async def get_todo_stats(db: AsyncSession) -> Dict[str, Any]:
        pending_orders = await db.execute(
            select(func.count(Order.id)).where(Order.status == "pending")
        )
        confirmed_orders = await db.execute(
            select(func.count(Order.id)).where(Order.status == "confirmed")
        )
        pending_adoptions = await db.execute(
            select(func.count(AdoptionApplication.id)).where(
                AdoptionApplication.status == "pending"
            )
        )
        pending_follow_ups = await db.execute(
            select(func.count(FollowUpTask.id)).where(FollowUpTask.status == "pending")
        )
        overdue_follow_ups = await db.execute(
            select(func.count(FollowUpTask.id)).where(
                and_(
                    FollowUpTask.status == "pending",
                    FollowUpTask.scheduled_time < datetime.utcnow(),
                )
            )
        )

        return {
            "pending_orders": pending_orders.scalar_one(),
            "confirmed_orders": confirmed_orders.scalar_one(),
            "pending_adoptions": pending_adoptions.scalar_one(),
            "pending_follow_ups": pending_follow_ups.scalar_one(),
            "overdue_follow_ups": overdue_follow_ups.scalar_one(),
        }

    @staticmethod
    async def get_exception_stats(db: AsyncSession) -> Dict[str, Any]:
        after_sale_orders = await db.execute(
            select(func.count(Order.id)).where(Order.status == "after_sale")
        )
        cancelled_orders_today = await db.execute(
            select(func.count(Order.id)).where(
                and_(
                    Order.status == "cancelled",
                    func.date(Order.updated_at) == date.today(),
                )
            )
        )
        high_risk_schedules = await db.execute(
            select(func.count(Schedule.id)).where(
                and_(
                    Schedule.risk_level == "high",
                    Schedule.date >= date.today(),
                    Schedule.date <= date.today() + timedelta(days=7),
                )
            )
        )
        rejected_adoptions = await db.execute(
            select(func.count(AdoptionApplication.id)).where(
                AdoptionApplication.status == "rejected"
            )
        )

        return {
            "after_sale_orders": after_sale_orders.scalar_one(),
            "cancelled_orders_today": cancelled_orders_today.scalar_one(),
            "high_risk_schedules": high_risk_schedules.scalar_one(),
            "rejected_adoptions": rejected_adoptions.scalar_one(),
        }

    @staticmethod
    async def get_order_trend(db: AsyncSession, days: int = 7) -> Dict[str, Any]:
        start_date = date.today() - timedelta(days=days - 1)
        result = await db.execute(
            select(
                func.date(Order.created_at).label("order_date"),
                func.count(Order.id).label("count"),
                func.coalesce(func.sum(Order.amount), 0).label("total_amount"),
            )
            .where(func.date(Order.created_at) >= start_date)
            .group_by(func.date(Order.created_at))
            .order_by("order_date")
        )
        rows = result.all()

        date_map = {row.order_date.isoformat(): {"count": row.count, "amount": float(row.total_amount)} for row in rows}

        labels = []
        order_counts = []
        order_amounts = []
        for i in range(days):
            d = (start_date + timedelta(days=i)).isoformat()
            labels.append(d)
            data = date_map.get(d, {"count": 0, "amount": 0.0})
            order_counts.append(data["count"])
            order_amounts.append(data["amount"])

        return {
            "labels": labels,
            "order_counts": order_counts,
            "order_amounts": order_amounts,
        }

    @staticmethod
    async def get_service_type_stats(db: AsyncSession) -> Dict[str, Any]:
        result = await db.execute(
            select(Order.service_type, func.count(Order.id))
            .group_by(Order.service_type)
            .order_by(func.count(Order.id).desc())
        )
        rows = result.all()
        return {
            "labels": [row[0] for row in rows],
            "data": [row[1] for row in rows],
        }

    @staticmethod
    async def get_overview_stats(db: AsyncSession) -> Dict[str, Any]:
        total_orders = await db.execute(select(func.count(Order.id)))
        total_pets = await db.execute(select(func.count(Pet.id)))
        total_customers = await db.execute(select(func.count(Customer.id)))
        today_orders = await db.execute(
            select(func.count(Order.id)).where(func.date(Order.created_at) == date.today())
        )
        today_revenue = await db.execute(
            select(func.coalesce(func.sum(Order.amount), 0)).where(
                and_(
                    func.date(Order.created_at) == date.today(),
                    Order.status.in_(["completed", "after_sale", "closed"]),
                )
            )
        )
        month_revenue = await db.execute(
            select(func.coalesce(func.sum(Order.amount), 0)).where(
                and_(
                    func.extract("year", Order.created_at) == date.today().year,
                    func.extract("month", Order.created_at) == date.today().month,
                    Order.status.in_(["completed", "after_sale", "closed"]),
                )
            )
        )

        return {
            "total_orders": total_orders.scalar_one(),
            "total_pets": total_pets.scalar_one(),
            "total_customers": total_customers.scalar_one(),
            "today_orders": today_orders.scalar_one(),
            "today_revenue": float(today_revenue.scalar_one()),
            "month_revenue": float(month_revenue.scalar_one()),
        }

    @staticmethod
    def get_mock_dashboard_data() -> Dict[str, Any]:
        now = datetime.now()
        today = date.today()

        todo_stats = {
            "pending_orders": 8,
            "confirmed_orders": 12,
            "pending_adoptions": 3,
            "pending_follow_ups": 15,
            "overdue_follow_ups": 2,
        }

        exception_stats = {
            "after_sale_orders": 2,
            "cancelled_orders_today": 1,
            "high_risk_schedules": 3,
            "rejected_adoptions": 1,
        }

        labels = []
        order_counts = []
        order_amounts = []
        for i in range(7):
            d = today - timedelta(days=6 - i)
            labels.append(d.isoformat())
            cnt = 5 + (i * 2) % 10
            order_counts.append(cnt)
            order_amounts.append(round(cnt * 80.0 + (i % 3) * 50, 2))

        order_trend = {
            "labels": labels,
            "order_counts": order_counts,
            "order_amounts": order_amounts,
        }

        service_type_stats = {
            "labels": ["基础洗护", "深度清洁", "造型修剪", "SPA护理", "寄养服务"],
            "data": [45, 30, 25, 18, 12],
        }

        overview_stats = {
            "total_orders": 1280,
            "total_pets": 356,
            "total_customers": 245,
            "today_orders": 12,
            "today_revenue": 2850.00,
            "month_revenue": 68500.00,
        }

        recent_todos = []
        todo_titles = [
            "新订单需要确认",
            "领养申请待审核",
            "回访任务需要执行",
            "售后工单需要处理",
            "排班需要确认",
        ]
        for i in range(5):
            recent_todos.append({
                "id": i + 1,
                "type": ["order", "adoption", "follow_up", "after_sale", "schedule"][i],
                "title": todo_titles[i],
                "related_id": (i * 3) + 1,
                "created_at": (now - timedelta(hours=i)).isoformat(),
                "priority": ["high", "medium", "high", "urgent", "low"][i],
            })

        recent_exceptions = []
        exception_titles = [
            "订单发起售后申请",
            "排班存在高风险",
            "客户回访超期未处理",
            "订单被取消",
        ]
        for i in range(4):
            recent_exceptions.append({
                "id": i + 1,
                "type": ["after_sale", "risk", "overdue", "cancel"][i],
                "title": exception_titles[i],
                "related_id": (i * 2) + 1,
                "created_at": (now - timedelta(hours=i * 2)).isoformat(),
            })

        return {
            "todo_stats": todo_stats,
            "exception_stats": exception_stats,
            "order_trend": order_trend,
            "service_type_stats": service_type_stats,
            "overview_stats": overview_stats,
            "recent_todos": recent_todos,
            "recent_exceptions": recent_exceptions,
        }
