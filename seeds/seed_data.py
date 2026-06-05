#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import (
    User, Role, Permission, user_roles, role_permissions,
    Vendor, Category, Booth, VendorApplication,
    Deposit, CheckinRecord, ViolationNote,
    VendorStatus, ApplicationStatus, BoothStatus,
    DepositStatus, CheckinStatus, ViolationSeverity, ViolationStatus
)
from app.core.security import get_password_hash
from app.core.permissions import ROLE_PERMISSIONS
from datetime import datetime, timedelta


def seed_database():
    db = SessionLocal()
    
    try:
        print("开始播种种子数据...")

        permissions = {}
        all_perm_names = set()
        for perms in ROLE_PERMISSIONS.values():
            all_perm_names.update(perms)
        
        for perm_name in all_perm_names:
            perm = db.query(Permission).filter(Permission.name == perm_name).first()
            if not perm:
                perm = Permission(name=perm_name, description=f"权限：{perm_name}")
                db.add(perm)
                db.flush()
            permissions[perm_name] = perm

        roles = {}
        for role_name in ROLE_PERMISSIONS.keys():
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=f"角色：{role_name}")
                db.add(role)
                db.flush()
            roles[role_name] = role
            
            for perm_name in ROLE_PERMISSIONS[role_name]:
                if perm_name in permissions:
                    if permissions[perm_name] not in role.permissions:
                        role.permissions.append(permissions[perm_name])

        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@marketplace.com",
                full_name="系统管理员",
                hashed_password=get_password_hash("admin123")
            )
            db.add(admin_user)
            db.flush()
        
        if roles["admin"] not in admin_user.roles:
            admin_user.roles.append(roles["admin"])

        organizer_user = db.query(User).filter(User.username == "organizer").first()
        if not organizer_user:
            organizer_user = User(
                username="organizer",
                email="organizer@marketplace.com",
                full_name="市集组织者",
                hashed_password=get_password_hash("organizer123")
            )
            db.add(organizer_user)
            db.flush()
        
        if roles["organizer"] not in organizer_user.roles:
            organizer_user.roles.append(roles["organizer"])

        staff_user = db.query(User).filter(User.username == "staff").first()
        if not staff_user:
            staff_user = User(
                username="staff",
                email="staff@marketplace.com",
                full_name="现场工作人员",
                hashed_password=get_password_hash("staff123")
            )
            db.add(staff_user)
            db.flush()
        
        if roles["staff"] not in staff_user.roles:
            staff_user.roles.append(roles["staff"])

        finance_user = db.query(User).filter(User.username == "finance").first()
        if not finance_user:
            finance_user = User(
                username="finance",
                email="finance@marketplace.com",
                full_name="财务人员",
                hashed_password=get_password_hash("finance123")
            )
            db.add(finance_user)
            db.flush()
        
        if roles["finance"] not in finance_user.roles:
            finance_user.roles.append(roles["finance"])

        categories_data = [
            {"name": "手工陶艺", "code": "CERAMIC", "color": "#E74C3C"},
            {"name": "皮具手作", "code": "LEATHER", "color": "#8B4513"},
            {"name": "布艺刺绣", "code": "TEXTILE", "color": "#9B59B6"},
            {"name": "木质工艺", "code": "WOOD", "color": "#D35400"},
            {"name": "首饰饰品", "code": "JEWELRY", "color": "#F1C40F"},
            {"name": "香薰蜡烛", "code": "CANDLE", "color": "#3498DB"},
            {"name": "手绘插画", "code": "ART", "color": "#2ECC71"},
            {"name": "咖啡饮品", "code": "COFFEE", "color": "#795548"},
        ]

        categories = {}
        for cat_data in categories_data:
            cat = db.query(Category).filter(Category.code == cat_data["code"]).first()
            if not cat:
                cat = Category(**cat_data)
                db.add(cat)
                db.flush()
            categories[cat_data["code"]] = cat

        vendors_data = [
            {"name": "陶然居工坊", "contact_person": "张师傅", "phone": "13800000001", "email": "zhang@example.com", "status": VendorStatus.APPROVED},
            {"name": "匠心皮具", "contact_person": "李女士", "phone": "13800000002", "email": "li@example.com", "status": VendorStatus.APPROVED},
            {"name": "绣娘坊", "contact_person": "王阿姨", "phone": "13800000003", "email": "wang@example.com", "status": VendorStatus.APPROVED},
            {"name": "木语工坊", "contact_person": "陈师傅", "phone": "13800000004", "email": "chen@example.com", "status": VendorStatus.APPROVED},
            {"name": "银月首饰", "contact_person": "赵小姐", "phone": "13800000005", "email": "zhao@example.com", "status": VendorStatus.APPROVED},
            {"name": "香韵小筑", "contact_person": "周女士", "phone": "13800000006", "email": "zhou@example.com", "status": VendorStatus.PENDING},
            {"name": "画堂春插画", "contact_person": "吴先生", "phone": "13800000007", "email": "wu@example.com", "status": VendorStatus.APPROVED},
            {"name": "慢时光咖啡", "contact_person": "郑师傅", "phone": "13800000008", "email": "zheng@example.com", "status": VendorStatus.APPROVED},
        ]

        vendors = {}
        for vend_data in vendors_data:
            vend = db.query(Vendor).filter(Vendor.name == vend_data["name"]).first()
            if not vend:
                vend = Vendor(**vend_data)
                db.add(vend)
                db.flush()
            vendors[vend_data["name"]] = vend

        zones = ["A区", "B区", "C区"]
        booths = []
        booth_counter = 1
        for zone in zones:
            for i in range(1, 9):
                booth_num = f"{zone[0]}{i:02d}"
                booth = db.query(Booth).filter(Booth.booth_number == booth_num).first()
                if not booth:
                    booth = Booth(
                        booth_number=booth_num,
                        zone=zone,
                        position_order=i,
                        size="2m x 2m",
                        status=BoothStatus.AVAILABLE
                    )
                    db.add(booth)
                    db.flush()
                booths.append(booth)
                booth_counter += 1

        event_date = datetime.now() + timedelta(days=7)
        event_date = event_date.replace(hour=9, minute=0, second=0, microsecond=0)

        vendor_category_map = [
            ("陶然居工坊", "CERAMIC"),
            ("匠心皮具", "LEATHER"),
            ("绣娘坊", "TEXTILE"),
            ("木语工坊", "WOOD"),
            ("银月首饰", "JEWELRY"),
            ("画堂春插画", "ART"),
            ("慢时光咖啡", "COFFEE"),
        ]

        applications = []
        for vendor_name, cat_code in vendor_category_map:
            vendor = vendors[vendor_name]
            category = categories[cat_code]
            
            app = db.query(VendorApplication).filter(
                VendorApplication.vendor_id == vendor.id,
                VendorApplication.event_date == event_date
            ).first()
            if not app:
                app = VendorApplication(
                    vendor_id=vendor.id,
                    category_id=category.id,
                    event_date=event_date,
                    product_description=f"{vendor.name}的精品{category.name}",
                    status=ApplicationStatus.APPROVED,
                    reviewed_by=admin_user.id,
                    reviewed_at=datetime.utcnow()
                )
                db.add(app)
                db.flush()
            applications.append(app)

        pending_vendor = vendors["香韵小筑"]
        pending_app = db.query(VendorApplication).filter(
            VendorApplication.vendor_id == pending_vendor.id,
            VendorApplication.event_date == event_date
        ).first()
        if not pending_app:
            pending_app = VendorApplication(
                vendor_id=pending_vendor.id,
                category_id=categories["CANDLE"].id,
                event_date=event_date,
                product_description="天然植物香薰蜡烛",
                status=ApplicationStatus.NEW
            )
            db.add(pending_app)
            db.flush()

        for i, app in enumerate(applications[:5]):
            deposit = db.query(Deposit).filter(
                Deposit.vendor_id == app.vendor_id,
                Deposit.application_id == app.id
            ).first()
            if not deposit:
                deposit = Deposit(
                    vendor_id=app.vendor_id,
                    application_id=app.id,
                    amount=500.00,
                    status=DepositStatus.PAID if i < 3 else DepositStatus.PENDING,
                    payment_method="微信支付" if i < 3 else None,
                    transaction_id=f"TXN{datetime.now().strftime('%Y%m%d')}{i:04d}" if i < 3 else None,
                    paid_at=datetime.utcnow() if i < 3 else None
                )
                db.add(deposit)
                db.flush()

        db.commit()
        print("种子数据播种完成！")
        print(f"  - 创建了 {len(permissions)} 个权限")
        print(f"  - 创建了 {len(roles)} 个角色")
        print(f"  - 创建了 4 个用户（admin/organizer/staff/finance）")
        print(f"  - 创建了 {len(categories)} 个品类")
        print(f"  - 创建了 {len(vendors)} 个摊主")
        print(f"  - 创建了 {len(booths)} 个摊位")
        print(f"  - 创建了 {len(applications) + 1} 个报名申请")
        print("\n默认账号：")
        print("  管理员：admin / admin123")
        print("  组织者：organizer / organizer123")
        print("  工作人员：staff / staff123")
        print("  财务：finance / finance123")

    except Exception as e:
        db.rollback()
        print(f"播种失败：{e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
