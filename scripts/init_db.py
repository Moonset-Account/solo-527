import os
import sys
from datetime import datetime, date, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models import (
    Region, Community, Technician, RepairOrder, Review,
    OrderStatus, TechnicianStatus, RefundReason, ActionType
)
from app.utils import generate_order_no, log_action, build_full_address


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        regions_data = [
            {"name": "朝阳区", "city": "北京", "demand_level": 85},
            {"name": "海淀区", "city": "北京", "demand_level": 92},
            {"name": "丰台区", "city": "北京", "demand_level": 68},
            {"name": "东城区", "city": "北京", "demand_level": 55},
        ]
        regions = []
        for r_data in regions_data:
            r = Region(**r_data)
            db.add(r)
            regions.append(r)
        db.flush()

        communities_data = [
            {"name": "望京SOHO花园", "region_id": regions[0].id, "address_prefix": "北京市朝阳区望京街道"},
            {"name": "国贸阳光小区", "region_id": regions[0].id, "address_prefix": "北京市朝阳区建外街道"},
            {"name": "中关村软件园社区", "region_id": regions[1].id, "address_prefix": "北京市海淀区中关村街道"},
            {"name": "学院路家属院", "region_id": regions[1].id, "address_prefix": "北京市海淀区学院路街道"},
            {"name": "方庄芳城园", "region_id": regions[2].id, "address_prefix": "北京市丰台区方庄街道"},
            {"name": "王府井东堂社区", "region_id": regions[3].id, "address_prefix": "北京市东城区东华门街道"},
        ]
        communities = []
        for c_data in communities_data:
            c = Community(**c_data)
            db.add(c)
            communities.append(c)
        db.flush()

        technicians_data = [
            {"name": "张师傅", "phone": "13800000001", "skill_level": 3, "community_id": communities[0].id, "daily_max_orders": 10},
            {"name": "李师傅", "phone": "13800000002", "skill_level": 2, "community_id": communities[1].id, "daily_max_orders": 8},
            {"name": "王师傅", "phone": "13800000003", "skill_level": 4, "community_id": communities[2].id, "daily_max_orders": 12},
            {"name": "赵师傅", "phone": "13800000004", "skill_level": 2, "community_id": communities[3].id, "daily_max_orders": 8},
            {"name": "陈师傅", "phone": "13800000005", "skill_level": 3, "community_id": communities[4].id, "daily_max_orders": 9},
            {"name": "刘师傅", "phone": "13800000006", "skill_level": 1, "community_id": communities[5].id, "daily_max_orders": 6},
        ]
        technicians = []
        for t_data in technicians_data:
            t = Technician(**t_data)
            db.add(t)
            technicians.append(t)
        db.flush()

        appliance_types = ["空调", "冰箱", "洗衣机", "热水器", "电视", "油烟机", "微波炉"]
        faults = [
            "不制冷、噪音大", "无法启动", "漏水严重", "通电跳闸",
            "温度控制失灵", "异响", "排水堵塞", "屏幕花屏"
        ]
        customers = [
            ("王先生", "13910000001"), ("李女士", "13910000002"), ("张先生", "13910000003"),
            ("刘女士", "13910000004"), ("陈先生", "13910000005"), ("杨女士", "13910000006"),
            ("黄先生", "13910000007"), ("周女士", "13910000008"), ("吴先生", "13910000009"),
            ("郑女士", "13910000010"),
        ]
        time_slots = ["上午 9:00-12:00", "下午 14:00-17:00", "晚上 18:00-20:00"]

        statuses = list(OrderStatus)
        today = date.today()

        for i in range(28):
            cust_name, cust_phone = random.choice(customers)
            comm = random.choice(communities)
            tech = random.choice(technicians)
            days_offset = random.randint(-5, 3)
            sched = today + timedelta(days=days_offset)
            status = random.choice(statuses) if days_offset <= 0 else random.choice([OrderStatus.PENDING, OrderStatus.ASSIGNED])

            order = RepairOrder(
                order_no=generate_order_no(),
                customer_name=cust_name,
                customer_phone=cust_phone,
                appliance_type=random.choice(appliance_types),
                fault_description=random.choice(faults),
                fault_photos=[],
                status=status.value,
                priority=random.randint(1, 3),
                region_id=comm.region_id,
                community_id=comm.id,
                address_detail=f"{random.randint(1, 30)}号楼{random.randint(1, 30)}单元{random.randint(101, 2503)}室",
                schedule_date=sched if status in [OrderStatus.PENDING, OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS] else sched,
                schedule_time_slot=random.choice(time_slots),
                technician_id=tech.id if status != OrderStatus.PENDING else None,
                assigned_at=datetime.now() - timedelta(hours=random.randint(1, 48)) if status != OrderStatus.PENDING else None,
                repair_fee=random.choice([80, 120, 150, 200, 250, 300]) if status in [OrderStatus.COMPLETED, OrderStatus.REFUNDED] else 0,
                parts_fee=random.choice([0, 50, 100, 180, 260]) if status in [OrderStatus.COMPLETED, OrderStatus.REFUNDED] else 0,
                paid=status == OrderStatus.COMPLETED,
            )
            order.total_fee = order.repair_fee + order.parts_fee
            order.full_address = build_full_address(
                comm.region.name if comm.region else None,
                comm.name,
                order.address_detail
            )
            if status == OrderStatus.REFUNDED:
                order.refund_reason = random.choice(list(RefundReason)).value
                order.refund_note = random.choice(["客户坚持退款", "二次返修", "协商一致"])
                order.refund_amount = order.total_fee * random.choice([0.5, 0.8, 1.0])
                order.refunded_at = datetime.now()

            if status in [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED, OrderStatus.REFUNDED]:
                order.started_at = (order.assigned_at or datetime.now()) + timedelta(minutes=random.randint(20, 90))
            if status in [OrderStatus.COMPLETED, OrderStatus.REFUNDED]:
                order.completed_at = (order.started_at or datetime.now()) + timedelta(minutes=random.randint(40, 180))

            db.add(order)
            db.flush()

            log_action(
                db, ActionType.CREATE_ORDER, "系统管理员", order.id,
                {"order_no": order.order_no, "customer": cust_name}
            )

            if order.technician_id:
                log_action(
                    db, ActionType.ASSIGN_TECHNICIAN, "系统管理员", order.id,
                    {"technician_id": order.technician_id, "technician_name": tech.name}
                )

            if status == OrderStatus.COMPLETED:
                from app.models import WorkRecord
                db.add(WorkRecord(
                    order_id=order.id,
                    technician_id=order.technician_id,
                    work_date=order.schedule_date,
                    community_id=order.community_id,
                    hours_spent=round(random.uniform(0.5, 3.5), 1),
                    status=status.value
                ))
                if random.random() > 0.3:
                    rev = Review(
                        order_id=order.id,
                        technician_id=order.technician_id,
                        rating=random.randint(3, 5),
                        comment=random.choice(["师傅很专业，修得很快", "态度好，解释清楚", "满意", "一般般"]),
                        revisit_note="已确认修复正常",
                        revisited=True,
                        revisited_by="客服小王",
                        revisited_at=datetime.now() - timedelta(days=random.randint(0, 2))
                    )
                    db.add(rev)
                    log_action(db, ActionType.REVIEW, "客服小王", order.id, {"rating": rev.rating})
            elif status == OrderStatus.REFUNDED:
                from app.models import WorkRecord
                db.add(WorkRecord(
                    order_id=order.id,
                    technician_id=order.technician_id,
                    work_date=order.schedule_date,
                    community_id=order.community_id,
                    hours_spent=round(random.uniform(0.3, 2.0), 1),
                    status="refunded"
                ))
                log_action(db, ActionType.REFUND, "站长", order.id, {"amount": order.refund_amount})

        db.commit()
        print("数据库初始化完成，种子数据已写入。")
    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
