#!/usr/bin/env python3
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models import User, Order, DeliveryNode, PhotoSelection, DeliveryFile, ExceptionTicket, ExceptionLog, Satisfaction, Invoice, MaterialAuthorization
from app.auth import get_password_hash
from app.schemas import UserRole, OrderStatus, DeliveryNodeType, ExceptionType, ExceptionStatus


def init_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


def init_test_users(db: Session):
    print("Creating test users...")

    test_users = [
        {
            "username": "admin",
            "name": "系统管理员",
            "role": UserRole.ADMIN,
            "password": "test123",
            "email": "admin@example.com",
            "phone": "13800000001",
            "is_test_account": False
        },
        {
            "username": "photographer",
            "name": "张摄影师",
            "role": UserRole.PHOTOGRAPHER,
            "password": "test123",
            "email": "photographer@example.com",
            "phone": "13800000002",
            "is_test_account": False
        },
        {
            "username": "photographer2",
            "name": "李摄影师",
            "role": UserRole.PHOTOGRAPHER,
            "password": "test123",
            "email": "photographer2@example.com",
            "phone": "13800000003",
            "is_test_account": False
        },
        {
            "username": "videolead",
            "name": "王视频负责人",
            "role": UserRole.VIDEO_LEAD,
            "password": "test123",
            "email": "videolead@example.com",
            "phone": "13800000004",
            "is_test_account": False
        },
        {
            "username": "test_photographer",
            "name": "测试摄影师",
            "role": UserRole.PHOTOGRAPHER,
            "password": "test123",
            "email": "test@example.com",
            "phone": "13800000005",
            "is_test_account": True
        }
    ]

    for user_data in test_users:
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing:
            user = User(
                username=user_data["username"],
                name=user_data["name"],
                role=user_data["role"],
                hashed_password=get_password_hash(user_data["password"]),
                email=user_data["email"],
                phone=user_data["phone"],
                is_test_account=user_data["is_test_account"],
                is_active=True
            )
            db.add(user)
            print(f"  Created user: {user_data['username']} ({user_data['name']})")
        else:
            print(f"  User already exists: {user_data['username']}")

    db.commit()
    print("Test users created successfully!")


def init_sample_data(db: Session):
    print("Creating sample data...")

    photographers = db.query(User).filter(User.role == UserRole.PHOTOGRAPHER, User.is_test_account == False).all()
    if not photographers:
        print("No photographers found, skipping sample data creation")
        return

    videolead = db.query(User).filter(User.role == UserRole.VIDEO_LEAD).first()

    client_names = ["王先生", "李女士", "张先生", "陈女士", "刘先生", "周女士", "吴先生", "郑女士"]
    shoot_types = ["婚礼摄影", "个人写真", "宝宝百天照", "全家福", "商业活动", "产品拍摄", "毕业照", "旅游跟拍", "生日派对", "企业年会"]

    status_list = [
        OrderStatus.PENDING, OrderStatus.SHOOTING, OrderStatus.SELECTING,
        OrderStatus.SELECTED, OrderStatus.EDITING,
        OrderStatus.DELIVERED, OrderStatus.COMPLETED
    ]

    created_orders = []

    for i in range(15):
        photographer = random.choice(photographers)
        client_name = random.choice(client_names)
        shoot_type = random.choice(shoot_types)

        order_status = random.choice(status_list)

        shoot_date = datetime.now() - timedelta(days=random.randint(1, 60))
        created_at = shoot_date - timedelta(days=random.randint(3, 10))
        total_amount = random.choice([2999, 3999, 5999, 8999, 12999, 18888])
        photo_count = random.choice([30, 50, 80, 100])

        selected_count = 0
        if order_status in [OrderStatus.SELECTED, OrderStatus.EDITING, OrderStatus.DELIVERED, OrderStatus.COMPLETED]:
            selected_count = random.randint(int(photo_count * 0.5), photo_count)

        delivered_count = 0
        if order_status in [OrderStatus.DELIVERED, OrderStatus.COMPLETED]:
            delivered_count = random.randint(3, 8)

        order = Order(
            order_no=f"ORD{datetime.now().strftime('%Y%m')}{i+1:04d}",
            customer_name=client_name,
            customer_phone=f"138{random.randint(10000000, 99999999)}",
            photographer_id=photographer.id,
            shoot_type=shoot_type,
            shoot_date=shoot_date,
            total_amount=total_amount,
            prepaid_amount=total_amount * random.choice([0.3, 0.5, 0.8, 1.0]),
            photo_count=photo_count,
            selected_count=selected_count,
            delivered_count=delivered_count,
            status=order_status,
            is_test_data=photographer.is_test_account,
            created_at=created_at,
            updated_at=datetime.now()
        )

        db.add(order)
        db.flush()
        created_orders.append(order)

        node_configs = [
            (DeliveryNodeType.SHOOT_COMPLETE, "拍摄完成", shoot_date + timedelta(hours=8)),
            (DeliveryNodeType.SELECT_CONFIRM, "选片确认", shoot_date + timedelta(days=3)),
            (DeliveryNodeType.EDIT_START, "开始精修", shoot_date + timedelta(days=4)),
            (DeliveryNodeType.FIRST_DRAFT, "初版交付", shoot_date + timedelta(days=10)),
            (DeliveryNodeType.FINAL_DELIVER, "最终交付", shoot_date + timedelta(days=15)),
            (DeliveryNodeType.CUSTOMER_CONFIRM, "客户确认", shoot_date + timedelta(days=17)),
        ]

        for node_type, node_name, expected_at in node_configs:
            is_completed = False
            actual_at = None

            if node_type == DeliveryNodeType.SHOOT_COMPLETE and order_status not in [OrderStatus.PENDING]:
                is_completed = True
                actual_at = expected_at + timedelta(hours=random.randint(-2, 2))
            elif node_type == DeliveryNodeType.SELECT_CONFIRM and order_status in [OrderStatus.SELECTED, OrderStatus.EDITING, OrderStatus.DELIVERED, OrderStatus.COMPLETED]:
                is_completed = True
                actual_at = expected_at + timedelta(days=random.randint(-1, 1))
            elif node_type == DeliveryNodeType.EDIT_START and order_status in [OrderStatus.EDITING, OrderStatus.DELIVERED, OrderStatus.COMPLETED]:
                is_completed = True
                actual_at = expected_at + timedelta(days=random.randint(-1, 1))
            elif node_type == DeliveryNodeType.FIRST_DRAFT and order_status in [OrderStatus.DELIVERED, OrderStatus.COMPLETED]:
                is_completed = True
                actual_at = expected_at + timedelta(days=random.randint(-1, 2))
            elif node_type == DeliveryNodeType.FINAL_DELIVER and order_status in [OrderStatus.DELIVERED, OrderStatus.COMPLETED]:
                is_completed = True
                actual_at = expected_at + timedelta(days=random.randint(-1, 2))
            elif node_type == DeliveryNodeType.CUSTOMER_CONFIRM and order_status == OrderStatus.COMPLETED:
                is_completed = True
                actual_at = expected_at + timedelta(days=random.randint(-1, 2))

            node = DeliveryNode(
                order_id=order.id,
                node_type=node_type,
                node_name=node_name,
                expected_at=expected_at,
                actual_at=actual_at,
                is_completed=is_completed,
                operator_id=photographer.id if is_completed else None,
                created_at=created_at
            )
            db.add(node)

        for p_idx in range(photo_count):
            is_selected = p_idx < selected_count
            selection = PhotoSelection(
                order_id=order.id,
                photo_key=f"{order.order_no}_{p_idx+1:04d}",
                thumbnail_url="/static/images/placeholder.svg",
                original_url=f"/uploads/{order.id}/photos/IMG_{p_idx+1:04d}.jpg",
                is_selected=is_selected,
                selected_at=shoot_date + timedelta(days=random.randint(2, 5)) if is_selected else None,
                selected_by=photographer.id if is_selected else None
            )
            db.add(selection)

        if order_status in [OrderStatus.DELIVERED, OrderStatus.COMPLETED]:
            file_count = random.randint(2, 5)
            for f_idx in range(file_count):
                file_types = ["image", "video", "archive"]
                file_type = random.choice(file_types)

                if file_type == "image":
                    file_name = f"精修_{f_idx+1:02d}.jpg"
                elif file_type == "video":
                    file_name = f"视频_{f_idx+1:02d}.mp4"
                else:
                    file_name = f"原图打包.part{f_idx+1}.zip"

                delivery_file = DeliveryFile(
                    order_id=order.id,
                    file_name=file_name,
                    file_path=f"/uploads/{order.id}/deliverables/{file_name}",
                    file_size=random.randint(5000000, 200000000),
                    file_type=file_type,
                    is_downloaded=random.random() > 0.5,
                    download_count=random.randint(0, 5),
                    uploaded_at=shoot_date + timedelta(days=random.randint(10, 15))
                )
                db.add(delivery_file)

        if order_status == OrderStatus.COMPLETED and random.random() > 0.3:
            rating = random.choices([5, 4, 3, 2, 1], weights=[0.5, 0.3, 0.12, 0.05, 0.03], k=1)[0]
            feedbacks = [
                "非常满意，拍摄效果很好！",
                "摄影师很专业，服务态度也很好",
                "整体不错，后期修图很用心",
                "效果超出预期，下次还会选择",
                "拍摄过程很愉快，成品很满意"
            ]

            satisfaction = Satisfaction(
                order_id=order.id,
                rating=rating,
                feedback=random.choice(feedbacks) if rating >= 3 else "有些地方需要改进",
                rated_by=photographer.id,
                created_at=shoot_date + timedelta(days=random.randint(20, 30))
            )
            db.add(satisfaction)

        if order_status in [OrderStatus.DELIVERED, OrderStatus.COMPLETED]:
            invoice_status = "paid" if order_status == OrderStatus.COMPLETED else "issued"
            invoice = Invoice(
                order_id=order.id,
                invoice_no=f"INV{datetime.now().strftime('%Y%m')}{i+1:04d}",
                amount=total_amount,
                invoice_date=created_at + timedelta(days=2),
                status=invoice_status,
                is_received=order_status == OrderStatus.COMPLETED,
                created_at=created_at
            )
            db.add(invoice)

        if random.random() > 0.6:
            auth_types = ["personal", "commercial", "editorial"]
            auth_type = random.choice(auth_types)

            authorization = MaterialAuthorization(
                order_id=order.id,
                material_type=auth_type,
                scope="个人收藏展示，不得用于商业用途" if auth_type == "personal" else "商业宣传使用",
                valid_from=shoot_date,
                valid_to=shoot_date + timedelta(days=365),
                is_approved=random.random() > 0.3,
                approved_by=videolead.id if random.random() > 0.5 else None
            )
            db.add(authorization)

    exception_types = [
        (ExceptionType.PRICE_DIFF, "结算金额差异", "客户认为费用计算有误"),
        (ExceptionType.QUANTITY_DIFF, "数量差异", "交付数量与约定不符"),
        (ExceptionType.TIMEOUT_DIFF, "交付延迟", "超出承诺的交付时间"),
        (ExceptionType.QUALITY_DIFF, "质量问题", "客户对照片质量不满意"),
        (ExceptionType.OTHER_DIFF, "其他问题", "客户有其他诉求")
    ]

    for i in range(8):
        exc_type, exc_title, exc_desc = random.choice(exception_types)
        order = random.choice(created_orders)

        exc_statuses = [ExceptionStatus.PENDING, ExceptionStatus.PROCESSING, ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED]
        exc_status = random.choice(exc_statuses)

        amount_diff = 0.0
        if exc_type == ExceptionType.PRICE_DIFF:
            amount_diff = random.uniform(-2000, 2000)

        assignee_id = videolead.id if exc_status != ExceptionStatus.PENDING else None
        resolution = None
        resolved_at = None
        resolved_by = None

        if exc_status in [ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED]:
            resolution = "已与客户沟通，达成一致意见，问题已解决"
            resolved_at = datetime.now() - timedelta(days=random.randint(1, 5))
            resolved_by = videolead.id

        exception = ExceptionTicket(
            order_id=order.id,
            exception_type=exc_type,
            title=f"{order.customer_name} - {exc_title}",
            description=f"{exc_desc}。订单金额：¥{float(order.total_amount):.2f}",
            amount_diff=amount_diff,
            status=exc_status,
            assignee_id=assignee_id,
            resolution=resolution,
            resolved_at=resolved_at,
            resolved_by=resolved_by,
            created_at=datetime.now() - timedelta(days=random.randint(3, 10)),
            updated_at=datetime.now()
        )
        db.add(exception)
        db.flush()

        if exc_status != ExceptionStatus.PENDING:
            log = ExceptionLog(
                ticket_id=exception.id,
                action="开始处理",
                remark="已收到客户反馈，正在核实情况",
                operator_id=videolead.id,
                created_at=exception.created_at + timedelta(hours=2)
            )
            db.add(log)

            if exc_status in [ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED]:
                log2 = ExceptionLog(
                    ticket_id=exception.id,
                    action="处理完成",
                    remark="已与客户电话沟通，解释清楚费用明细，客户表示理解",
                    operator_id=videolead.id,
                    created_at=exception.created_at + timedelta(days=1)
                )
                db.add(log2)

    db.commit()
    print("Sample data created successfully!")


def main():
    db = next(get_db())
    try:
        init_database()
        init_test_users(db)
        init_sample_data(db)
        print("\n" + "="*50)
        print("Database initialization completed!")
        print("="*50)
        print("\nTest accounts:")
        print("  admin / test123        (管理员)")
        print("  photographer / test123 (摄影师)")
        print("  videolead / test123    (视频团队负责人)")
        print("  test_photographer / test123 (测试摄影师)")
        print("\nRun the following command to start the server:")
        print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print("\nThen open:")
        print("  http://localhost:8000")
    finally:
        db.close()


if __name__ == "__main__":
    main()
