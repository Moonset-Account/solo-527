from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, AfterSale
from app.models.customer import Customer
from app.models.pet import Pet
from app.models.service_package import ServicePackage
from app.schemas.order import OrderCreate, OrderUpdate, AfterSaleCreate, AfterSaleUpdate


class OrderService:
    @staticmethod
    def _generate_order_no() -> str:
        return f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{datetime.now().microsecond % 1000:03d}"

    @staticmethod
    async def get_by_id(db: AsyncSession, order_id: int) -> Optional[Order]:
        result = await db.execute(select(Order).where(Order.id == order_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_order_no(db: AsyncSession, order_no: str) -> Optional[Order]:
        result = await db.execute(select(Order).where(Order.order_no == order_no))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, order_in: OrderCreate) -> Order:
        order = Order(
            order_no=OrderService._generate_order_no(),
            pet_id=order_in.pet_id,
            customer_id=order_in.customer_id,
            service_type=order_in.service_type,
            package_id=order_in.package_id,
            appointment_time=order_in.appointment_time,
            amount=order_in.amount,
            remark=order_in.remark,
            status="pending",
        )
        db.add(order)
        await db.commit()
        await db.refresh(order)
        return order

    @staticmethod
    async def update(db: AsyncSession, db_order: Order, order_in: OrderUpdate) -> Order:
        update_data = order_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_order, field, value)
        await db.commit()
        await db.refresh(db_order)
        return db_order

    @staticmethod
    async def delete(db: AsyncSession, order_id: int) -> bool:
        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if order:
            await db.delete(order)
            await db.commit()
            return True
        return False

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        customer_id: Optional[int] = None,
        pet_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[int, List[Order]]:
        query = select(Order)
        if status:
            query = query.where(Order.status == status)
        if customer_id:
            query = query.where(Order.customer_id == customer_id)
        if pet_id:
            query = query.where(Order.pet_id == pet_id)
        if date_from:
            query = query.where(Order.appointment_time >= date_from)
        if date_to:
            query = query.where(Order.appointment_time <= date_to)

        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        orders = result.scalars().all()
        return total, orders

    @staticmethod
    async def update_status(db: AsyncSession, order_id: int, status: str) -> Optional[Order]:
        valid_transitions = {
            "pending": ["confirmed", "cancelled"],
            "confirmed": ["in_progress", "cancelled"],
            "in_progress": ["completed"],
            "completed": ["after_sale"],
            "after_sale": ["closed"],
            "cancelled": [],
            "closed": [],
        }
        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if not order:
            return None
        if status not in valid_transitions.get(order.status, []):
            raise ValueError(f"无法从状态 {order.status} 转换到 {status}")
        order.status = status
        if status == "in_progress":
            order.actual_start_time = datetime.utcnow()
        if status in ["completed", "closed"]:
            order.actual_end_time = datetime.utcnow()
        await db.commit()
        await db.refresh(order)
        return order

    @staticmethod
    async def create_after_sale(db: AsyncSession, after_sale_in: AfterSaleCreate, handled_by: int) -> AfterSale:
        after_sale = AfterSale(
            order_id=after_sale_in.order_id,
            problem_type=after_sale_in.problem_type,
            description=after_sale_in.description,
            solution=after_sale_in.solution,
            refund_amount=after_sale_in.refund_amount,
            handled_by=handled_by,
        )
        db.add(after_sale)

        result = await db.execute(select(Order).where(Order.id == after_sale_in.order_id))
        order = result.scalar_one_or_none()
        if order and order.status == "completed":
            order.status = "after_sale"

        await db.commit()
        await db.refresh(after_sale)
        return after_sale

    @staticmethod
    async def get_after_sale_by_order_id(db: AsyncSession, order_id: int) -> Optional[AfterSale]:
        result = await db.execute(select(AfterSale).where(AfterSale.order_id == order_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_after_sale(
        db: AsyncSession, db_after_sale: AfterSale, after_sale_in: AfterSaleUpdate
    ) -> AfterSale:
        update_data = after_sale_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_after_sale, field, value)
        await db.commit()
        await db.refresh(db_after_sale)
        return db_after_sale

    @staticmethod
    def generate_mock_orders(count: int = 20) -> List[dict]:
        statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled", "after_sale", "closed"]
        service_types = ["基础洗护", "深度清洁", "造型修剪", "SPA护理", "寄养服务"]
        mock_orders = []
        now = datetime.now()
        for i in range(1, count + 1):
            appointment = now + timedelta(days=i % 10 - 5, hours=i % 8)
            mock_orders.append({
                "id": i,
                "order_no": f"ORD{2026060000000 + i}",
                "pet_id": (i % 5) + 1,
                "customer_id": (i % 10) + 1,
                "service_type": service_types[i % len(service_types)],
                "package_id": (i % 3) + 1 if i % 3 != 0 else None,
                "appointment_time": appointment.isoformat(),
                "actual_start_time": (appointment + timedelta(minutes=10)).isoformat() if i % 3 == 0 else None,
                "actual_end_time": (appointment + timedelta(hours=2)).isoformat() if i % 3 == 0 else None,
                "status": statuses[i % len(statuses)],
                "amount": float(Decimal(f"{(i % 9 + 1) * 50}.00")),
                "remark": f"备注信息-{i}" if i % 2 == 0 else None,
                "pet_name": f"宠物{(i % 5) + 1}",
                "customer_name": f"客户{(i % 10) + 1}",
                "customer_phone": f"138{10000000 + i:08d}",
                "package_name": f"套餐{(i % 3) + 1}" if i % 3 != 0 else None,
                "created_at": (now - timedelta(days=i)).isoformat(),
                "updated_at": (now - timedelta(days=i // 2)).isoformat(),
            })
        return mock_orders

    @staticmethod
    def generate_mock_after_sale() -> dict:
        now = datetime.now()
        return {
            "id": 1,
            "order_id": 1,
            "problem_type": "服务不满意",
            "description": "洗护后宠物毛发打结",
            "solution": "免费重新洗护并赠送一次基础护理",
            "refund_amount": 0.00,
            "handled_by": 1,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
