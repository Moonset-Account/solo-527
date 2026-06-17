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
    
    client_names = ["王先生", "李女士", "张先生", "陈女士", "刘先生", "周女士", "吴先生", "郑女士"]
    order_titles = [
        "婚礼摄影", "个人写真", "宝宝百天照", "全家福", "商业活动", 
        "产品拍摄", "毕业照", "旅游跟拍", "生日派对", "企业年会"
    ]
    
    for i in range(15):
        photographer = random.choice(photographers)
        client_name = random.choice(client_names)
        title = random.choice(order_titles)
        
        status_weights = [0.1, 0.2, 0.15, 0.15, 0.15, 0.2, 0.05]
        statuses = [
            OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.AWAITING_SELECTION,
            OrderStatus.SELECTION_CONFIRMED, OrderStatus.READY_FOR_DOWNLOAD,
            OrderStatus.COMPLETED, OrderStatus.CANCELLED
        ]
        status = random.choices(statuses, weights=status_weights, k=1)[0]
        
        shoot_date = datetime.now() - timedelta(days=random.randint(1, 60))
        created_at = shoot_date - timedelta(days=random.randint(3, 10))
        
        order = Order(
            order_no=f"ORD{datetime.now().strftime('%Y%m')}{i+1:04d}",
            title=title,
            description=f"{client_name}的{title}拍摄订单",
            client_name=client_name,
            client_phone=f"138{random.randint(10000000, 99999999)}",
            photographer_id=photographer.id,
            photographer_name=photographer.name,
            total_amount=random.choice([2999, 3999, 5999, 8999, 12999, 18888]),
            status=status,
            shoot_date=shoot_date.date(),
            expected_delivery=shoot_date + timedelta(days=random.randint(15, 30)),
            included_photos=random.choice([30, 50, 80, 100]),
            download_expire_days=30,
            is_test_data=photographer.is_test_account,
            created_at=created_at,
            updated_at=datetime.now()
        )
        
        if status in [OrderStatus.SELECTION_CONFIRMED, OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED]:
            order.selection_confirmed_at = shoot_date + timedelta(days=random.randint(3, 7))
        
        if status in [OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED]:
            order.files_uploaded_at = shoot_date + timedelta(days=random.randint(10, 20))
        
        if status == OrderStatus.COMPLETED:
            order.completed_at = shoot_date + timedelta(days=random.randint(20, 30))
        
        db.add(order)
        db.flush()
        
        node_names = [
            ("订单确认", DeliveryNodeType.ORDER_CONFIRM, 0),
            ("拍摄完成", DeliveryNodeType.SHOOT_COMPLETE, 1),
            ("选片确认", DeliveryNodeType.SELECTION_CONFIRM, 3),
            ("精修完成", DeliveryNodeType.EDIT_COMPLETE, 7),
            ("成片上传", DeliveryNodeType.UPLOAD_COMPLETE, 10),
            ("订单完成", DeliveryNodeType.ORDER_COMPLETE, 15)
        ]
        
        for idx, (node_name, node_type, delay_days) in enumerate(node_names):
            expected_time = created_at + timedelta(days=delay_days)
            completed_at = None
            
            if status == OrderStatus.COMPLETED:
                completed_at = expected_time + timedelta(days=random.randint(-2, 2))
            elif idx <= 1 and status != OrderStatus.CANCELLED:
                completed_at = expected_time + timedelta(days=random.randint(-1, 1))
            elif idx == 2 and status in [OrderStatus.SELECTION_CONFIRMED, OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED]:
                completed_at = order.selection_confirmed_at
            elif idx == 3 and status in [OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED]:
                completed_at = order.files_uploaded_at - timedelta(days=random.randint(1, 3))
            elif idx == 4 and status in [OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED]:
                completed_at = order.files_uploaded_at
            elif idx == 5 and status == OrderStatus.COMPLETED:
                completed_at = order.completed_at
            
            node = DeliveryNode(
                order_id=order.id,
                node_name=node_name,
                node_type=node_type,
                expected_time=expected_time,
                completed_at=completed_at,
                sort_order=idx,
                created_at=created_at
            )
            db.add(node)
        
        photo_count = random.randint(20, 50)
        selected_count = random.randint(int(photo_count * 0.6), photo_count)
        
        for p_idx in range(photo_count):
            is_selected = p_idx < selected_count and status in [OrderStatus.SELECTION_CONFIRMED, OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED]
            photo = PhotoSelection(
                order_id=order.id,
                file_name=f"IMG_{p_idx+1:04d}.jpg",
                file_path=f"/uploads/{order.id}/photos/IMG_{p_idx+1:04d}.jpg",
                thumbnail_url=f"/static/images/placeholder.svg",
                file_size=random.randint(3000000, 10000000),
                sort_order=p_idx,
                selected=is_selected,
                selected_at=order.selection_confirmed_at if is_selected else None,
                created_at=shoot_date
            )
            db.add(photo)
        
        if status in [OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED]:
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
                    description=f"{title}的交付文件",
                    thumbnail_url=f"/static/images/placeholder.svg",
                    download_count=random.randint(0, 5),
                    uploaded_at=order.files_uploaded_at,
                    created_at=order.files_uploaded_at
                )
                db.add(delivery_file)
        
        if status == OrderStatus.COMPLETED and random.random() > 0.3:
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
                client_name=client_name,
                photographer_id=photographer.id,
                photographer_name=photographer.name,
                rating=rating,
                feedback=random.choice(feedbacks) if rating >= 3 else "有些地方需要改进",
                created_at=order.completed_at + timedelta(days=random.randint(1, 5))
            )
            db.add(satisfaction)
        
        if status in [OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED]:
            invoice_status = "paid" if status == OrderStatus.COMPLETED else "invoiced"
            invoice = Invoice(
                order_id=order.id,
                order_no=order.order_no,
                client_name=client_name,
                amount=order.total_amount,
                status=invoice_status,
                invoice_no=f"INV{datetime.now().strftime('%Y%m')}{i+1:04d}",
                invoice_date=created_at + timedelta(days=2),
                payment_date=order.completed_at if status == OrderStatus.COMPLETED else None,
                due_date=created_at + timedelta(days=30),
                created_at=created_at
            )
            db.add(invoice)
        
        if random.random() > 0.7:
            auth_types = ["personal", "commercial", "editorial", "exclusive"]
            auth_type = random.choice(auth_types)
            
            authorization = MaterialAuthorization(
                order_id=order.id,
                order_no=order.order_no,
                client_name=client_name,
                auth_no=f"AUTH{datetime.now().strftime('%Y%m')}{i+1:04d}",
                auth_type=auth_type,
                usage_scope="个人收藏展示，不得用于商业用途" if auth_type == "personal" else "商业宣传使用",
                start_date=shoot_date,
                end_date=shoot_date + timedelta(days=365),
                created_at=created_at
            )
            db.add(authorization)
    
    exception_types = [
        (ExceptionType.SETTLEMENT_DIFF, "结算金额差异", "客户认为费用计算有误"),
        (ExceptionType.DELIVERY_DELAY, "交付时间延迟", "超出承诺的交付时间"),
        (ExceptionType.QUALITY_ISSUE, "照片质量问题", "客户对照片质量不满意"),
        (ExceptionType.OTHER, "其他问题", "客户有其他诉求")
    ]
    
    for i in range(8):
        exc_type, exc_title, exc_desc = random.choice(exception_types)
        order = db.query(Order).filter(Order.status.in_([OrderStatus.READY_FOR_DOWNLOAD, OrderStatus.COMPLETED])).first()
        
        if not order:
            continue
        
        status_weights = [0.3, 0.3, 0.3, 0.1]
        exc_statuses = [ExceptionStatus.PENDING, ExceptionStatus.PROCESSING, ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED]
        exc_status = random.choices(exc_statuses, weights=status_weights, k=1)[0]
        
        expected_amount = order.total_amount
        actual_amount = expected_amount
        amount_diff = 0
        
        if exc_type == ExceptionType.SETTLEMENT_DIFF:
            diff_percent = random.uniform(-0.2, 0.2)
            actual_amount = expected_amount * (1 + diff_percent)
            amount_diff = actual_amount - expected_amount
        
        exception = ExceptionTicket(
            order_id=order.id,
            order_no=order.order_no,
            client_name=order.client_name,
            title=f"{order.client_name} - {exc_title}",
            description=f"{exc_desc}。订单金额：¥{expected_amount:.2f}",
            exception_type=exc_type,
            status=exc_status,
            expected_amount=expected_amount,
            actual_amount=actual_amount,
            amount_diff=amount_diff,
            handler_id=2 if exc_status in [ExceptionStatus.PROCESSING, ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED] else None,
            handler_name="王视频负责人" if exc_status in [ExceptionStatus.PROCESSING, ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED] else None,
            handled_at=datetime.now() - timedelta(days=random.randint(1, 5)) if exc_status != ExceptionStatus.PENDING else None,
            result="已与客户沟通，达成一致意见，问题已解决" if exc_status in [ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED] else None,
            reason="沟通不畅导致的误解，已重新解释费用明细" if exc_status in [ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED] else None,
            created_at=datetime.now() - timedelta(days=random.randint(3, 10)),
            updated_at=datetime.now()
        )
        db.add(exception)
        db.flush()
        
        if exc_status != ExceptionStatus.PENDING:
            log = ExceptionLog(
                exception_id=exception.id,
                handler_id=2,
                handler_name="王视频负责人",
                action="开始处理",
                remark="已收到客户反馈，正在核实情况",
                created_at=exception.created_at + timedelta(hours=2)
            )
            db.add(log)
            
            if exc_status in [ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED]:
                log2 = ExceptionLog(
                    exception_id=exception.id,
                    handler_id=2,
                    handler_name="王视频负责人",
                    action="问题解决",
                    remark="已与客户电话沟通，解释清楚费用明细，客户表示理解",
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
