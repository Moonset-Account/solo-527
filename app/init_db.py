#!/usr/bin/env python3
import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.supplier import Supplier, RiskLevel
from app.models.purchase import PurchaseRequest, PurchaseStatus
from app.models.approval import ApprovalLevel
from app.models.invoice import InvoiceStatus
from app.models.price import PriceRecord
from app.utils.security import hash_password


def init_database():
    print("=" * 60)
    print("工程材料供应商准入管理系统 - 数据库初始化")
    print("=" * 60)
    
    print("\n📦 创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建完成")
    
    db = SessionLocal()
    
    try:
        print("\n👤 创建默认用户...")
        create_default_users(db)
        
        print("\n📋 创建发票状态...")
        create_invoice_statuses(db)
        
        print("\n🔐 创建审批层级...")
        create_approval_levels(db)
        
        print("\n🏭 创建示例供应商...")
        create_sample_suppliers(db)
        
        print("\n📝 创建示例采购需求...")
        create_sample_purchases(db)
        
        print("\n💰 创建示例价格记录...")
        create_sample_prices(db)
        
        print("\n" + "=" * 60)
        print("✅ 数据库初始化完成！")
        print("=" * 60)
        print("\n默认登录账号:")
        print("  管理员: admin / admin123")
        print("  经理: manager / manager123")
        print("  审核员: auditor / auditor123")
        print("  采购员: buyer / buyer123")
        
    except Exception as e:
        print(f"\n❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


def create_default_users(db: Session):
    users = [
        {
            "username": "admin",
            "password": "admin123",
            "name": "系统管理员",
            "email": "admin@example.com",
            "phone": "13800000000",
            "role": UserRole.admin
        },
        {
            "username": "manager",
            "password": "manager123",
            "name": "张经理",
            "email": "manager@example.com",
            "phone": "13800000001",
            "role": UserRole.manager
        },
        {
            "username": "auditor",
            "password": "auditor123",
            "name": "李审核",
            "email": "auditor@example.com",
            "phone": "13800000002",
            "role": UserRole.AUDITOR
        },
        {
            "username": "buyer",
            "password": "buyer123",
            "name": "王采购",
            "email": "buyer@example.com",
            "phone": "13800000003",
            "role": UserRole.buyer
        }
    ]
    
    for user_data in users:
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if existing:
            print(f"  ⏭️  用户 {user_data['username']} 已存在，跳过")
            continue
        
        user = User(
            username=user_data["username"],
            password_hash=hash_password(user_data["password"]),
            real_name=user_data["name"],
            email=user_data["email"],
            phone=user_data["phone"],
            role=user_data["role"],
            is_active=True
        )
        db.add(user)
        print(f"  ✅ 创建用户: {user_data['username']} ({user_data['name']})")
    
    db.commit()


def create_invoice_statuses(db: Session):
    statuses = [
        {"code": "UNISSUED", "name": "未开票", "description": "尚未开具发票", "sort_order": 1, "color": "#86909C"},
        {"code": "ISSUED", "name": "已开票", "description": "已开具发票", "sort_order": 2, "color": "#165DFF"},
        {"code": "RECEIVED", "name": "已收票", "description": "已收到发票", "sort_order": 3, "color": "#FF7D00"},
        {"code": "VERIFIED", "name": "已认证", "description": "发票已认证抵扣", "sort_order": 4, "color": "#00B42A"},
        {"code": "REJECTED", "name": "已退票", "description": "发票已退回", "sort_order": 5, "color": "#F53F3F"}
    ]
    
    for status_data in statuses:
        existing = db.query(InvoiceStatus).filter(InvoiceStatus.code == status_data["code"]).first()
        if existing:
            print(f"  ⏭️  发票状态 {status_data['code']} 已存在，跳过")
            continue
        
        status = InvoiceStatus(**status_data)
        db.add(status)
        print(f"  ✅ 创建发票状态: {status_data['code']} - {status_data['name']}")
    
    db.commit()


def create_approval_levels(db: Session):
    levels = [
        {
            "level": 1,
            "name": "初级审批",
            "condition": "budget <= 50000",
            "is_active": True,
            "approvers": ["auditor"]
        },
        {
            "level": 2,
            "name": "中级审批",
            "condition": "budget > 50000 and budget <= 200000",
            "is_active": True,
            "approvers": ["auditor", "manager"]
        },
        {
            "level": 3,
            "name": "高级审批",
            "condition": "budget > 200000",
            "is_active": True,
            "approvers": ["auditor", "manager", "admin"]
        }
    ]
    
    for level_data in levels:
        existing = db.query(ApprovalLevel).filter(ApprovalLevel.level == level_data["level"]).first()
        if existing:
            print(f"  ⏭️  审批层级 {level_data['level']} 已存在，跳过")
            continue
        
        approver_usernames = level_data.pop("approvers", [])
        level = ApprovalLevel(**level_data)
        db.add(level)
        db.flush()
        
        for username in approver_usernames:
            user = db.query(User).filter(User.username == username).first()
            if user:
                level_user = ApprovalLevelUser(level_id=level.id, user_id=user.id)
                db.add(level_user)
        
        print(f"  ✅ 创建审批层级: 第{level_data['level']}级 - {level_data['name']}")
    
    db.commit()


def create_sample_suppliers(db: Session):
    suppliers = [
        {
            "name": "上海建工材料有限公司",
            "contact_person": "张总",
            "contact_phone": "13900000001",
            "address": "上海市浦东新区张江高科技园区",
            "business_license": "91310000MA1H123456",
            "qualification_cert": "建资证字第001号",
            "status": "audited"
        },
        {
            "name": "江苏建材集团",
            "contact_person": "李经理",
            "contact_phone": "13900000002",
            "address": "江苏省南京市江宁开发区",
            "business_license": "91320000MA1H234567",
            "qualification_cert": "建资证字第002号",
            "status": "audited"
        },
        {
            "name": "浙江钢结构工程公司",
            "contact_person": "王厂长",
            "contact_phone": "13900000003",
            "address": "浙江省杭州市萧山区",
            "business_license": "91330000MA1H345678",
            "qualification_cert": "建资证字第003号",
            "status": "pending"
        },
        {
            "name": "安徽水泥制品厂",
            "contact_person": "赵主任",
            "contact_phone": "13900000004",
            "address": "安徽省合肥市高新区",
            "business_license": "91340000MA1H456789",
            "qualification_cert": "建资证字第004号",
            "status": "pending"
        }
    ]
    
    admin = db.query(User).filter(User.username == "admin").first()
    
    for supplier_data in suppliers:
        existing = db.query(Supplier).filter(Supplier.name == supplier_data["name"]).first()
        if existing:
            print(f"  ⏭️  供应商 {supplier_data['name']} 已存在，跳过")
            continue
        
        supplier = Supplier(
            **supplier_data,
            created_by=admin.id if admin else 1
        )
        db.add(supplier)
        print(f"  ✅ 创建供应商: {supplier_data['name']}")
    
    db.commit()


def create_sample_purchases(db: Session):
    buyer = db.query(User).filter(User.username == "buyer").first()
    supplier1 = db.query(Supplier).filter(Supplier.name == "上海建工材料有限公司").first()
    supplier2 = db.query(Supplier).filter(Supplier.name == "江苏建材集团").first()
    
    purchases = [
        {
            "material_name": "钢筋",
            "specification": "HRB400 φ25mm",
            "quantity": 100,
            "unit": "吨",
            "budget": 550000,
            "expected_delivery": datetime.now() + timedelta(days=30),
            "supplier_id": supplier1.id if supplier1 else None,
            "status": PurchaseStatus.PENDING,
            "remark": "用于主体结构工程",
            "created_by": buyer.id if buyer else 1
        },
        {
            "material_name": "水泥",
            "specification": "P.O 42.5",
            "quantity": 500,
            "unit": "吨",
            "budget": 280000,
            "expected_delivery": datetime.now() + timedelta(days=15),
            "supplier_id": supplier2.id if supplier2 else None,
            "status": PurchaseStatus.APPROVED,
            "remark": "用于混凝土搅拌站",
            "created_by": buyer.id if buyer else 1
        },
        {
            "material_name": "砂石",
            "specification": "5-25mm 连续级配",
            "quantity": 2000,
            "unit": "立方米",
            "budget": 120000,
            "expected_delivery": datetime.now() + timedelta(days=10),
            "supplier_id": None,
            "status": PurchaseStatus.DRAFT,
            "remark": "需要三家报价",
            "created_by": buyer.id if buyer else 1
        },
        {
            "material_name": "钢结构构件",
            "specification": "Q355B 焊接H型钢",
            "quantity": 300,
            "unit": "吨",
            "budget": 2100000,
            "expected_delivery": datetime.now() + timedelta(days=60),
            "supplier_id": None,
            "status": PurchaseStatus.QUOTED,
            "remark": "用于厂房建设",
            "created_by": buyer.id if buyer else 1
        },
        {
            "material_name": "墙体砌块",
            "specification": "240x115x53mm  MU10",
            "quantity": 50000,
            "unit": "块",
            "budget": 35000,
            "expected_delivery": datetime.now() + timedelta(days=20),
            "supplier_id": supplier1.id if supplier1 else None,
            "status": PurchaseStatus.DELIVERED,
            "remark": "用于砌筑工程",
            "created_by": buyer.id if buyer else 1
        }
    ]
    
    for purchase_data in purchases:
        request_no = f"PR{datetime.now().strftime('%Y%m%d')}{str(db.query(PurchaseRequest).count() + 1).zfill(4)}"
        
        purchase = PurchaseRequest(
            **purchase_data,
            request_no=request_no
        )
        db.add(purchase)
        db.flush()
        print(f"  ✅ 创建采购需求: {request_no} - {purchase_data['material_name']}")
    
    db.commit()


def create_sample_prices(db: Session):
    supplier1 = db.query(Supplier).filter(Supplier.name == "上海建工材料有限公司").first()
    supplier2 = db.query(Supplier).filter(Supplier.name == "江苏建材集团").first()
    
    today = datetime.now()
    
    prices = [
        {
            "material_name": "钢筋 HRB400 φ25mm",
            "specification": "HRB400 φ25mm",
            "supplier_id": supplier1.id if supplier1 else None,
            "price": 5500,
            "record_date": today - timedelta(days=30),
            "expires_at": today + timedelta(days=60),
            "is_expired": False
        },
        {
            "material_name": "钢筋 HRB400 φ25mm",
            "specification": "HRB400 φ25mm",
            "supplier_id": supplier2.id if supplier2 else None,
            "price": 5450,
            "record_date": today - timedelta(days=20),
            "expires_at": today + timedelta(days=70),
            "is_expired": False
        },
        {
            "material_name": "水泥 P.O 42.5",
            "specification": "P.O 42.5",
            "supplier_id": supplier1.id if supplier1 else None,
            "price": 560,
            "record_date": today - timedelta(days=45),
            "expires_at": today + timedelta(days=45),
            "is_expired": False
        },
        {
            "material_name": "水泥 P.O 42.5",
            "specification": "P.O 42.5",
            "supplier_id": supplier2.id if supplier2 else None,
            "price": 555,
            "record_date": today - timedelta(days=15),
            "expires_at": today + timedelta(days=75),
            "is_expired": False
        },
        {
            "material_name": "钢结构构件 Q355B",
            "specification": "Q355B 焊接H型钢",
            "supplier_id": supplier1.id if supplier1 else None,
            "price": 7000,
            "record_date": today - timedelta(days=60),
            "expires_at": today + timedelta(days=30),
            "is_expired": False
        },
        {
            "material_name": "砂石 5-25mm",
            "specification": "5-25mm 连续级配",
            "supplier_id": supplier2.id if supplier2 else None,
            "price": 60,
            "record_date": today - timedelta(days=10),
            "expires_at": today + timedelta(days=80),
            "is_expired": False
        }
    ]
    
    admin = db.query(User).filter(User.username == "admin").first()
    
    for price_data in prices:
        price = PriceRecord(
            **price_data,
            created_by=admin.id if admin else 1
        )
        db.add(price)
        print(f"  ✅ 创建价格记录: {price_data['material_name']} - ¥{price_data['price']}/吨")
    
    db.commit()


if __name__ == "__main__":
    init_database()
