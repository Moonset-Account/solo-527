#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import (
    User, Role, Permission, user_roles, role_permissions,
    Vendor, Category, Booth, VendorApplication, BoothAssignment,
    Deposit, CheckinRecord, ViolationNote,
    VendorStatus, ApplicationStatus, BoothStatus, AssignmentStatus,
    DepositStatus, DepositType, CheckinStatus, ViolationSeverity, ViolationStatus
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

        today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        yesterday = today - timedelta(days=1)
        next_week = today + timedelta(days=7)

        all_applications = []
        all_deposits = []
        all_assignments = []
        all_checkins = []
        all_violations = []

        vendor_list = list(vendors.values())

        # ===== 昨日活动：已归档数据 =====
        past_apps = []
        for i, vendor in enumerate(vendor_list[:5]):
            cat_code = list(categories.keys())[i % len(categories)]
            app = VendorApplication(
                vendor_id=vendor.id,
                category_id=categories[cat_code].id,
                event_date=yesterday,
                product_description=f"{vendor.name}的精品{categories[cat_code].name}",
                status=ApplicationStatus.CONFIRMED,
                reviewed_by=admin_user.id,
                reviewed_at=yesterday - timedelta(days=3)
            )
            db.add(app)
            db.flush()
            past_apps.append(app)
            all_applications.append(app)

        for i, app in enumerate(past_apps):
            assignment = BoothAssignment(
                booth_id=booths[i].id,
                vendor_id=app.vendor_id,
                application_id=app.id,
                event_date=yesterday,
                status=AssignmentStatus.CONFIRMED,
                lottery_round=1,
                assigned_at=yesterday - timedelta(days=2),
                confirmed_at=yesterday - timedelta(days=1)
            )
            db.add(assignment)
            db.flush()
            all_assignments.append(assignment)

            deposit = Deposit(
                vendor_id=app.vendor_id,
                application_id=app.id,
                amount=500.00,
                deposit_type=DepositType.STANDARD,
                status=DepositStatus.REFUNDED,
                payment_method="微信支付",
                transaction_id=f"TXN{yesterday.strftime('%Y%m%d')}{i:04d}",
                paid_at=yesterday - timedelta(days=2),
                refund_method="原路返回",
                refund_transaction_id=f"REF{yesterday.strftime('%Y%m%d')}{i:04d}",
                refunded_at=today - timedelta(hours=2)
            )
            db.add(deposit)
            db.flush()
            all_deposits.append(deposit)

            checkin = CheckinRecord(
                vendor_id=app.vendor_id,
                assignment_id=assignment.id,
                event_date=yesterday,
                status=CheckinStatus.CHECKED_IN,
                checkin_time=yesterday.replace(hour=8, minute=30),
                checked_in_by=staff_user.id,
                sales_amount=round(1500 + i * 500, 2),
                sales_notes="销售情况良好",
                deposit_review_triggered=0
            )
            db.add(checkin)
            db.flush()
            all_checkins.append(checkin)

        # ===== 今日活动：执行中 + 异常复核 =====
        today_apps = []
        for i, vendor in enumerate(vendor_list[2:7]):
            cat_code = list(categories.keys())[(i + 2) % len(categories)]
            app = VendorApplication(
                vendor_id=vendor.id,
                category_id=categories[cat_code].id,
                event_date=today,
                product_description=f"{vendor.name}的精品{categories[cat_code].name}",
                status=ApplicationStatus.CONFIRMED,
                reviewed_by=admin_user.id,
                reviewed_at=today - timedelta(days=2)
            )
            db.add(app)
            db.flush()
            today_apps.append(app)
            all_applications.append(app)

        for i, app in enumerate(today_apps):
            assignment = BoothAssignment(
                booth_id=booths[i + 5].id,
                vendor_id=app.vendor_id,
                application_id=app.id,
                event_date=today,
                status=AssignmentStatus.CONFIRMED,
                lottery_round=1,
                assigned_at=today - timedelta(days=1),
                confirmed_at=today - timedelta(hours=12)
            )
            db.add(assignment)
            db.flush()
            all_assignments.append(assignment)

            deposit = Deposit(
                vendor_id=app.vendor_id,
                application_id=app.id,
                amount=500.00,
                deposit_type=DepositType.STANDARD,
                status=DepositStatus.PAID,
                payment_method="微信支付",
                transaction_id=f"TXN{today.strftime('%Y%m%d')}{i:04d}",
                paid_at=today - timedelta(days=1)
            )
            db.add(deposit)
            db.flush()
            all_deposits.append(deposit)

        # 已签到的
        for i, app in enumerate(today_apps[:3]):
            checkin = CheckinRecord(
                vendor_id=app.vendor_id,
                assignment_id=all_assignments[-5 + i].id,
                event_date=today,
                status=CheckinStatus.CHECKED_IN,
                checkin_time=today.replace(hour=8, minute=15 + i * 5),
                checked_in_by=staff_user.id,
                deposit_review_triggered=0
            )
            db.add(checkin)
            db.flush()
            all_checkins.append(checkin)

        # 待签到的
        for i, app in enumerate(today_apps[3:]):
            checkin = CheckinRecord(
                vendor_id=app.vendor_id,
                assignment_id=all_assignments[-2 + i].id,
                event_date=today,
                status=CheckinStatus.PENDING,
                deposit_review_triggered=0
            )
            db.add(checkin)
            db.flush()
            all_checkins.append(checkin)

        # 未签到的，触发保证金复核
        no_show_vendor = vendor_list[4]
        no_show_app = VendorApplication(
            vendor_id=no_show_vendor.id,
            category_id=categories["LEATHER"].id,
            event_date=today,
            product_description=f"{no_show_vendor.name}的皮具产品",
            status=ApplicationStatus.CONFIRMED,
            reviewed_by=admin_user.id,
            reviewed_at=today - timedelta(days=2)
        )
        db.add(no_show_app)
        db.flush()
        all_applications.append(no_show_app)

        no_show_assignment = BoothAssignment(
            booth_id=booths[10].id,
            vendor_id=no_show_vendor.id,
            application_id=no_show_app.id,
            event_date=today,
            status=AssignmentStatus.CONFIRMED,
            lottery_round=1,
            assigned_at=today - timedelta(days=1),
            confirmed_at=today - timedelta(hours=12)
        )
        db.add(no_show_assignment)
        db.flush()
        all_assignments.append(no_show_assignment)

        no_show_deposit = Deposit(
            vendor_id=no_show_vendor.id,
            application_id=no_show_app.id,
            amount=500.00,
            deposit_type=DepositType.STANDARD,
            status=DepositStatus.UNDER_REVIEW,
            payment_method="支付宝",
            transaction_id=f"TXN{today.strftime('%Y%m%d')}9999",
            paid_at=today - timedelta(days=1),
            review_notes="活动日未签到，自动触发保证金复核",
            reviewed_by=admin_user.id,
            reviewed_at=datetime.utcnow()
        )
        db.add(no_show_deposit)
        db.flush()
        all_deposits.append(no_show_deposit)

        no_show_checkin = CheckinRecord(
            vendor_id=no_show_vendor.id,
            assignment_id=no_show_assignment.id,
            event_date=today,
            status=CheckinStatus.NO_SHOW,
            notes="联系不上摊主",
            deposit_review_triggered=1
        )
        db.add(no_show_checkin)
        db.flush()
        all_checkins.append(no_show_checkin)

        # 违规记录 - 处理中
        violation_vendor = vendor_list[2]
        violation = ViolationNote(
            vendor_id=violation_vendor.id,
            event_date=today,
            reported_by=staff_user.id,
            severity=ViolationSeverity.MINOR,
            status=ViolationStatus.REVIEWING,
            title="摊位超占公共区域",
            description="摊主将展示架摆放在摊位外的过道上，影响通行",
            action_taken="已口头警告，要求整改"
        )
        db.add(violation)
        db.flush()
        all_violations.append(violation)

        # 违规记录 - 已解决（归档）
        resolved_violation = ViolationNote(
            vendor_id=vendor_list[0].id,
            event_date=yesterday,
            reported_by=staff_user.id,
            severity=ViolationSeverity.MODERATE,
            status=ViolationStatus.RESOLVED,
            title="噪音扰民",
            description="手工制作工具噪音较大，周边摊主投诉",
            action_taken="要求采取降噪措施",
            resolution_notes="已加装隔音垫，问题解决",
            resolved_by=organizer_user.id,
            resolved_at=yesterday.replace(hour=14, minute=30)
        )
        db.add(resolved_violation)
        db.flush()
        all_violations.append(resolved_violation)

        # ===== 下周活动：新建 + 待确认 =====
        future_apps = []
        for i, vendor in enumerate(vendor_list[5:]):
            cat_code = list(categories.keys())[(i + 5) % len(categories)]
            app = VendorApplication(
                vendor_id=vendor.id,
                category_id=categories[cat_code].id,
                event_date=next_week,
                product_description=f"{vendor.name}的精品{categories[cat_code].name}",
                status=ApplicationStatus.NEW if i == 0 else ApplicationStatus.APPROVED,
                reviewed_by=admin_user.id if i > 0 else None,
                reviewed_at=datetime.utcnow() if i > 0 else None,
                review_notes="符合要求" if i > 0 else None
            )
            db.add(app)
            db.flush()
            future_apps.append(app)
            all_applications.append(app)

        # 已抽签待确认的
        drawn_apps = future_apps[1:3]
        for i, app in enumerate(drawn_apps):
            assignment = BoothAssignment(
                booth_id=booths[i + 12].id,
                vendor_id=app.vendor_id,
                application_id=app.id,
                event_date=next_week,
                status=AssignmentStatus.DRAWN,
                lottery_round=1,
                assigned_at=datetime.utcnow()
            )
            db.add(assignment)
            db.flush()
            all_assignments.append(assignment)

        # 待缴保证金的
        for i, app in enumerate(future_apps[1:]):
            deposit = Deposit(
                vendor_id=app.vendor_id,
                application_id=app.id,
                amount=500.00,
                deposit_type=DepositType.STANDARD,
                status=DepositStatus.PENDING
            )
            db.add(deposit)
            db.flush()
            all_deposits.append(deposit)

        # ===== 原有下周活动申请 =====
        for vendor_name, cat_code in [
            ("陶然居工坊", "CERAMIC"),
            ("匠心皮具", "LEATHER"),
            ("绣娘坊", "TEXTILE"),
            ("木语工坊", "WOOD"),
            ("银月首饰", "JEWELRY"),
            ("画堂春插画", "ART"),
            ("慢时光咖啡", "COFFEE"),
        ]:
            vendor = vendors[vendor_name]
            category = categories[cat_code]
            app = db.query(VendorApplication).filter(
                VendorApplication.vendor_id == vendor.id,
                VendorApplication.event_date == next_week
            ).first()
            if not app:
                app = VendorApplication(
                    vendor_id=vendor.id,
                    category_id=category.id,
                    event_date=next_week,
                    product_description=f"{vendor.name}的精品{category.name}",
                    status=ApplicationStatus.APPROVED,
                    reviewed_by=admin_user.id,
                    reviewed_at=datetime.utcnow()
                )
                db.add(app)
                db.flush()
                all_applications.append(app)

        db.commit()
        print("种子数据播种完成！")
        print(f"  - 创建了 {len(permissions)} 个权限")
        print(f"  - 创建了 {len(roles)} 个角色")
        print(f"  - 创建了 4 个用户（admin/organizer/staff/finance）")
        print(f"  - 创建了 {len(categories)} 个品类")
        print(f"  - 创建了 {len(vendors)} 个摊主")
        print(f"  - 创建了 {len(booths)} 个摊位")
        print(f"  - 创建了 {len(all_applications)} 个报名申请")
        print(f"  - 创建了 {len(all_assignments)} 个摊位分配")
        print(f"  - 创建了 {len(all_deposits)} 条保证金记录")
        print(f"  - 创建了 {len(all_checkins)} 条签到记录")
        print(f"  - 创建了 {len(all_violations)} 条违规记录")
        print(f"\n  数据分布（五列看板）：")
        print(f"    📝 新建：下周新报名 + 待缴保证金")
        print(f"    ⏳ 待确认：审核通过待确认 + 抽签待确认")
        print(f"    🔄 执行中：今日待签到摊主")
        print(f"    ⚠️  异常复核：未签到保证金复核 + 违规处理中")
        print(f"    ✅ 已归档：昨日已完成活动 + 已解决违规")
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
