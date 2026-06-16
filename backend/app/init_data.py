from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import date, timedelta
from .database import SessionLocal, Base, engine
from . import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def init_database():
    db = SessionLocal()
    try:
        user_count = db.query(models.User).count()
        if user_count > 0:
            print("Database already initialized, skipping data initialization.")
            return

        print("Creating users...")
        users = [
            {
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "系统管理员",
                "hashed_password": get_password_hash("admin123"),
                "role": models.UserRole.ADMIN,
                "department": "信息部",
                "phone": "13800000001",
            },
            {
                "username": "manager",
                "email": "manager@example.com",
                "full_name": "采购经理",
                "hashed_password": get_password_hash("manager123"),
                "role": models.UserRole.MANAGER,
                "department": "采购部",
                "phone": "13800000002",
            },
            {
                "username": "procurement",
                "email": "procurement@example.com",
                "full_name": "采购专员",
                "hashed_password": get_password_hash("proc123"),
                "role": models.UserRole.PROCUREMENT,
                "department": "采购部",
                "phone": "13800000003",
            },
            {
                "username": "frontline",
                "email": "frontline@example.com",
                "full_name": "行政专员",
                "hashed_password": get_password_hash("front123"),
                "role": models.UserRole.FRONTLINE,
                "department": "行政部",
                "phone": "13800000004",
            },
            {
                "username": "project",
                "email": "project@example.com",
                "full_name": "项目负责人",
                "hashed_password": get_password_hash("proj123"),
                "role": models.UserRole.PROJECT_OWNER,
                "department": "项目部",
                "phone": "13800000005",
            },
        ]
        for user_data in users:
            user = models.User(**user_data)
            db.add(user)
        db.commit()

        print("Creating material categories...")
        categories = [
            {"name": "办公文具", "code": "CAT001", "description": "日常办公文具用品"},
            {"name": "打印耗材", "code": "CAT002", "description": "打印机、复印机耗材"},
            {"name": "IT设备", "code": "CAT003", "description": "电脑配件、外设等"},
            {"name": "清洁用品", "code": "CAT004", "description": "清洁卫生用品"},
            {"name": "办公家具", "code": "CAT005", "description": "办公桌椅、柜子等"},
        ]
        cat_objs = []
        for cat_data in categories:
            cat = models.MaterialCategory(**cat_data)
            db.add(cat)
            cat_objs.append(cat)
        db.commit()
        for cat in cat_objs:
            db.refresh(cat)

        print("Creating materials...")
        admin_user = db.query(models.User).filter(models.User.username == "frontline").first()
        materials = [
            {
                "name": "A4复印纸", "code": "MAT001", "specification": "70g 500张/包",
                "unit": "包", "category_id": cat_objs[0].id,
                "brand": "Double A", "model": "A4-70g",
                "min_stock": 10, "description": "标准A4复印纸",
                "created_by": admin_user.id,
            },
            {
                "name": "A3复印纸", "code": "MAT002", "specification": "70g 500张/包",
                "unit": "包", "category_id": cat_objs[0].id,
                "brand": "Double A", "model": "A3-70g",
                "min_stock": 5, "description": "标准A3复印纸",
                "created_by": admin_user.id,
            },
            {
                "name": "中性笔(黑)", "code": "MAT003", "specification": "0.5mm 12支/盒",
                "unit": "盒", "category_id": cat_objs[0].id,
                "brand": "晨光", "model": "AGP87902",
                "min_stock": 20, "description": "黑色中性笔",
                "created_by": admin_user.id,
            },
            {
                "name": "硒鼓(HP12A)", "code": "MAT004", "specification": "HP LaserJet 1020/1018",
                "unit": "个", "category_id": cat_objs[1].id,
                "brand": "HP", "model": "Q2612A",
                "min_stock": 2, "description": "原装黑色硒鼓",
                "created_by": admin_user.id,
            },
            {
                "name": "墨粉盒(兄弟)", "code": "MAT005", "specification": "TN-2325 2600页",
                "unit": "个", "category_id": cat_objs[1].id,
                "brand": "Brother", "model": "TN-2325",
                "min_stock": 3, "description": "原装墨粉盒",
                "created_by": admin_user.id,
            },
            {
                "name": "无线鼠标", "code": "MAT006", "specification": "2.4G 静音",
                "unit": "个", "category_id": cat_objs[2].id,
                "brand": "Logitech", "model": "M220",
                "min_stock": 5, "description": "静音无线鼠标",
                "created_by": admin_user.id,
            },
            {
                "name": "键盘", "code": "MAT007", "specification": "USB有线 机械手感",
                "unit": "个", "category_id": cat_objs[2].id,
                "brand": "Logitech", "model": "K120",
                "min_stock": 3, "description": "标准有线键盘",
                "created_by": admin_user.id,
            },
            {
                "name": "洗手液", "code": "MAT008", "specification": "500ml 抑菌型",
                "unit": "瓶", "category_id": cat_objs[3].id,
                "brand": "蓝月亮", "model": "健康洗手液",
                "min_stock": 10, "description": "抑菌洗手液",
                "created_by": admin_user.id,
            },
            {
                "name": "抽纸", "code": "MAT009", "specification": "3层120抽 8包/提",
                "unit": "提", "category_id": cat_objs[3].id,
                "brand": "维达", "model": "V2866",
                "min_stock": 10, "description": "软抽纸巾",
                "created_by": admin_user.id,
            },
        ]
        mat_objs = []
        for mat_data in materials:
            mat = models.Material(**mat_data)
            db.add(mat)
            mat_objs.append(mat)
        db.commit()
        for mat in mat_objs:
            db.refresh(mat)

        print("Creating suppliers...")
        procurement_user = db.query(models.User).filter(models.User.username == "procurement").first()
        suppliers = [
            {
                "name": "北京办公文具有限公司", "code": "SUP001",
                "contact_person": "张经理", "phone": "010-12345678",
                "email": "sales@bjoffice.com", "address": "北京市朝阳区建国路88号",
                "tax_number": "91110101MA001ABC12",
                "bank_name": "工商银行北京分行", "bank_account": "0200 1234 5678 9012 345",
                "risk_level": models.SupplierRiskLevel.LOW,
                "status": models.SupplierStatus.ACTIVE,
                "credit_rating": 90, "on_time_delivery_rate": 98.5, "quality_score": 95.0,
                "created_by": procurement_user.id,
            },
            {
                "name": "上海打印设备科技有限公司", "code": "SUP002",
                "contact_person": "李销售", "phone": "021-87654321",
                "email": "info@shprint.com", "address": "上海市浦东新区张江高科技园区",
                "tax_number": "91310101MA001DEF34",
                "bank_name": "建设银行上海分行", "bank_account": "0220 8765 4321 0987 654",
                "risk_level": models.SupplierRiskLevel.LOW,
                "status": models.SupplierStatus.ACTIVE,
                "credit_rating": 88, "on_time_delivery_rate": 95.0, "quality_score": 92.0,
                "created_by": procurement_user.id,
            },
            {
                "name": "广州IT配件批发中心", "code": "SUP003",
                "contact_person": "王老板", "phone": "020-11112222",
                "email": "sales@gzit.com", "address": "广州市天河区太平洋电脑城",
                "tax_number": "91440101MA001GHI56",
                "bank_name": "招商银行广州分行", "bank_account": "0200 2222 3333 4444 555",
                "risk_level": models.SupplierRiskLevel.MEDIUM,
                "status": models.SupplierStatus.ACTIVE,
                "credit_rating": 75, "on_time_delivery_rate": 85.0, "quality_score": 82.0,
                "created_by": procurement_user.id,
            },
            {
                "name": "深圳清洁日用品有限公司", "code": "SUP004",
                "contact_person": "陈女士", "phone": "0755-33334444",
                "email": "sales@szclean.com", "address": "深圳市南山区科技园",
                "tax_number": "91440301MA001JKL78",
                "bank_name": "中国银行深圳分行", "bank_account": "0200 3333 4444 5555 666",
                "risk_level": models.SupplierRiskLevel.LOW,
                "status": models.SupplierStatus.ACTIVE,
                "credit_rating": 92, "on_time_delivery_rate": 99.0, "quality_score": 96.0,
                "created_by": procurement_user.id,
            },
            {
                "name": "问题供应商有限公司", "code": "SUP005",
                "contact_person": "赵总", "phone": "010-99998888",
                "email": "info@bad.com", "address": "北京市郊区某工业园",
                "tax_number": "91110101MA001MNO90",
                "bank_name": "某银行", "bank_account": "0200 9999 8888 7777 666",
                "risk_level": models.SupplierRiskLevel.HIGH,
                "status": models.SupplierStatus.SUSPENDED,
                "credit_rating": 45, "on_time_delivery_rate": 50.0, "quality_score": 40.0,
                "total_orders": 5, "total_amount": 25000.0,
                "created_by": procurement_user.id,
            },
        ]
        sup_objs = []
        for sup_data in suppliers:
            sup = models.Supplier(**sup_data)
            db.add(sup)
            sup_objs.append(sup)
        db.commit()
        for sup in sup_objs:
            db.refresh(sup)

        print("Creating quotes...")
        today = date.today()
        quotes = [
            {"material_id": mat_objs[0].id, "supplier_id": sup_objs[0].id, "unit_price": 18.50,
             "min_order_qty": 10, "delivery_days": 3, "payment_terms": "月结30天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.ACCEPTED, "submitted_by": procurement_user.id,
             "remarks": "长期合作价格"},
            {"material_id": mat_objs[0].id, "supplier_id": sup_objs[1].id, "unit_price": 19.80,
             "min_order_qty": 20, "delivery_days": 5, "payment_terms": "月结30天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.EVALUATED, "submitted_by": procurement_user.id,
             "remarks": "含运费"},
            {"material_id": mat_objs[0].id, "supplier_id": sup_objs[3].id, "unit_price": 17.90,
             "min_order_qty": 50, "delivery_days": 7, "payment_terms": "月结60天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.SUBMITTED, "submitted_by": procurement_user.id,
             "remarks": "大量采购优惠"},
            {"material_id": mat_objs[1].id, "supplier_id": sup_objs[0].id, "unit_price": 35.00,
             "min_order_qty": 10, "delivery_days": 3, "payment_terms": "月结30天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.ACCEPTED, "submitted_by": procurement_user.id},
            {"material_id": mat_objs[2].id, "supplier_id": sup_objs[0].id, "unit_price": 28.50,
             "min_order_qty": 5, "delivery_days": 2, "payment_terms": "月结30天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.ACCEPTED, "submitted_by": procurement_user.id},
            {"material_id": mat_objs[2].id, "supplier_id": sup_objs[2].id, "unit_price": 26.80,
             "min_order_qty": 10, "delivery_days": 3, "payment_terms": "月结60天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.EVALUATED, "submitted_by": procurement_user.id},
            {"material_id": mat_objs[3].id, "supplier_id": sup_objs[1].id, "unit_price": 420.00,
             "min_order_qty": 1, "delivery_days": 1, "payment_terms": "货到付款",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.ACCEPTED, "submitted_by": procurement_user.id,
             "remarks": "原装正品，质保3个月"},
            {"material_id": mat_objs[3].id, "supplier_id": sup_objs[2].id, "unit_price": 180.00,
             "min_order_qty": 1, "delivery_days": 2, "payment_terms": "月结30天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.EVALUATED, "submitted_by": procurement_user.id,
             "remarks": "国产兼容，质量稳定"},
            {"material_id": mat_objs[5].id, "supplier_id": sup_objs[2].id, "unit_price": 79.00,
             "min_order_qty": 1, "delivery_days": 1, "payment_terms": "月结30天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.ACCEPTED, "submitted_by": procurement_user.id},
            {"material_id": mat_objs[8].id, "supplier_id": sup_objs[3].id, "unit_price": 48.00,
             "min_order_qty": 5, "delivery_days": 2, "payment_terms": "月结30天",
             "valid_from": today, "valid_to": today + timedelta(days=90),
             "status": models.QuoteStatus.ACCEPTED, "submitted_by": procurement_user.id},
        ]
        quote_objs = []
        for idx, quote_data in enumerate(quotes):
            quote_data["quote_no"] = f"Q{today.strftime('%Y%m%d')}{idx+1:04d}"
            quote = models.Quote(**quote_data)
            db.add(quote)
            quote_objs.append(quote)
        db.commit()
        for quote in quote_objs:
            db.refresh(quote)

        print("Creating framework agreements...")
        manager_user = db.query(models.User).filter(models.User.username == "manager").first()
        agreements = [
            {
                "agreement_no": f"FA{today.strftime('%Y%m%d')}0001",
                "title": "2024年度办公文具采购框架协议",
                "supplier_id": sup_objs[0].id,
                "effective_date": today,
                "expiry_date": today + timedelta(days=365),
                "total_estimated_amount": 100000.00,
                "payment_terms": "月结30天",
                "delivery_terms": "订单确认后3个工作日内送货上门",
                "status": models.AgreementStatus.ACTIVE,
                "created_by": procurement_user.id,
                "approved_by": manager_user.id,
                "approved_at": today,
            },
            {
                "agreement_no": f"FA{today.strftime('%Y%m%d')}0002",
                "title": "2024年度打印耗材采购协议",
                "supplier_id": sup_objs[1].id,
                "effective_date": today,
                "expiry_date": today + timedelta(days=365),
                "total_estimated_amount": 50000.00,
                "payment_terms": "月结60天",
                "delivery_terms": "48小时内上门安装",
                "status": models.AgreementStatus.ACTIVE,
                "created_by": procurement_user.id,
                "approved_by": manager_user.id,
                "approved_at": today,
            },
        ]
        agree_objs = []
        for agree_data in agreements:
            agree = models.FrameworkAgreement(**agree_data)
            agree.remaining_amount = agree.total_estimated_amount
            db.add(agree)
            agree_objs.append(agree)
        db.commit()
        for agree in agree_objs:
            db.refresh(agree)

        print("Creating agreement items...")
        agreement_items = [
            {"agreement_id": agree_objs[0].id, "material_id": mat_objs[0].id,
             "unit_price": 18.50, "min_order_qty": 10, "delivery_days": 3, "contracted_qty": 2000},
            {"agreement_id": agree_objs[0].id, "material_id": mat_objs[1].id,
             "unit_price": 35.00, "min_order_qty": 10, "delivery_days": 3, "contracted_qty": 500},
            {"agreement_id": agree_objs[0].id, "material_id": mat_objs[2].id,
             "unit_price": 28.50, "min_order_qty": 5, "delivery_days": 2, "contracted_qty": 1000},
            {"agreement_id": agree_objs[1].id, "material_id": mat_objs[3].id,
             "unit_price": 420.00, "min_order_qty": 1, "delivery_days": 1, "contracted_qty": 50},
            {"agreement_id": agree_objs[1].id, "material_id": mat_objs[4].id,
             "unit_price": 280.00, "min_order_qty": 1, "delivery_days": 1, "contracted_qty": 30},
        ]
        for item_data in agreement_items:
            item = models.AgreementItem(**item_data)
            db.add(item)
        db.commit()

        print("Creating monthly usages...")
        for month in range(1, 7):
            usages = [
                {"material_id": mat_objs[0].id, "year": today.year, "month": month,
                 "quantity": 50 + month * 5, "department": "行政部", "recorded_by": admin_user.id},
                {"material_id": mat_objs[2].id, "year": today.year, "month": month,
                 "quantity": 20 + month * 2, "department": "行政部", "recorded_by": admin_user.id},
                {"material_id": mat_objs[8].id, "year": today.year, "month": month,
                 "quantity": 15 + month, "department": "行政部", "recorded_by": admin_user.id},
                {"material_id": mat_objs[3].id, "year": today.year, "month": month,
                 "quantity": 2, "department": "IT部", "recorded_by": admin_user.id},
            ]
            for usage_data in usages:
                usage = models.MonthlyUsage(**usage_data)
                db.add(usage)
        db.commit()

        print("Creating sample purchase requests...")
        project_user = db.query(models.User).filter(models.User.username == "project").first()
        pr_items1 = [
            {"material_id": mat_objs[0].id, "quantity": 50, "unit_price": 18.50, "quote_id": quote_objs[0].id},
            {"material_id": mat_objs[2].id, "quantity": 20, "unit_price": 28.50, "quote_id": quote_objs[4].id},
        ]
        pr1 = models.PurchaseRequest(
            pr_no=f"PR{today.strftime('%Y%m%d')}0001",
            title="2024年Q3办公文具采购需求",
            department="行政部",
            project_name="日常办公运营",
            project_owner_id=project_user.id,
            expected_date=today + timedelta(days=10),
            urgency="normal",
            total_estimated_amount=sum(item["quantity"] * item["unit_price"] for item in pr_items1),
            status=models.PurchaseRequestStatus.APPROVED,
            agreement_id=agree_objs[0].id,
            created_by=admin_user.id,
            approved_by=manager_user.id,
            approved_at=today,
        )
        db.add(pr1)
        db.commit()
        db.refresh(pr1)
        for item in pr_items1:
            item_data = {
                **item, "pr_id": pr1.id,
                "subtotal": item["quantity"] * item["unit_price"],
                "tax_rate": 13.0,
                "tax_amount": item["quantity"] * item["unit_price"] * 0.13,
                "total": item["quantity"] * item["unit_price"] * 1.13,
            }
            db.add(models.PurchaseOrderItem(**item_data))

        pr2 = models.PurchaseRequest(
            pr_no=f"PR{today.strftime('%Y%m%d')}0002",
            title="打印耗材应急采购",
            department="IT部",
            project_name="系统维护",
            project_owner_id=project_user.id,
            expected_date=today + timedelta(days=3),
            urgency="urgent",
            total_estimated_amount=420.00 * 2,
            status=models.PurchaseRequestStatus.SUBMITTED,
            created_by=admin_user.id,
        )
        db.add(pr2)
        db.commit()
        db.refresh(pr2)
        pr2_items = [
            {"pr_id": pr2.id, "material_id": mat_objs[3].id, "quantity": 2, "unit_price": 420.00,
             "quote_id": quote_objs[6].id,
             "subtotal": 840.00, "tax_rate": 13.0, "tax_amount": 109.20, "total": 949.20},
        ]
        for item in pr2_items:
            db.add(models.PurchaseOrderItem(**item))

        print("Creating sample purchase orders...")
        db.commit()
        po1 = models.PurchaseOrder(
            po_no=f"PO{today.strftime('%Y%m%d')}0001",
            pr_id=pr1.id,
            supplier_id=sup_objs[0].id,
            total_amount=1495.00,
            tax_amount=194.35,
            grand_total=1689.35,
            delivery_address="北京市朝阳区XX大厦15层前台",
            expected_delivery_date=today + timedelta(days=3),
            actual_delivery_date=today + timedelta(days=2),
            delivery_days_actual=2,
            payment_terms="月结30天",
            status=models.PurchaseOrderStatus.DELIVERED,
            created_by=procurement_user.id,
            sent_at=today,
            confirmed_at=today,
            completed_at=today + timedelta(days=2),
        )
        db.add(po1)
        db.commit()
        db.refresh(po1)
        po1_items = [
            {"po_id": po1.id, "pr_id": pr1.id, "material_id": mat_objs[0].id, "quantity": 50,
             "unit_price": 18.50, "quote_id": quote_objs[0].id,
             "subtotal": 925.00, "tax_rate": 13.0, "tax_amount": 120.25, "total": 1045.25,
             "delivered_qty": 50},
            {"po_id": po1.id, "pr_id": pr1.id, "material_id": mat_objs[2].id, "quantity": 20,
             "unit_price": 28.50, "quote_id": quote_objs[4].id,
             "subtotal": 570.00, "tax_rate": 13.0, "tax_amount": 74.10, "total": 644.10,
             "delivered_qty": 20},
        ]
        for item in po1_items:
            db.add(models.PurchaseOrderItem(**item))

        po2 = models.PurchaseOrder(
            po_no=f"PO{today.strftime('%Y%m%d')}0002",
            pr_id=pr2.id,
            supplier_id=sup_objs[1].id,
            total_amount=840.00,
            tax_amount=109.20,
            grand_total=949.20,
            delivery_address="北京市朝阳区XX大厦机房",
            expected_delivery_date=today + timedelta(days=1),
            payment_terms="货到付款",
            status=models.PurchaseOrderStatus.CONFIRMED,
            created_by=procurement_user.id,
            sent_at=today,
            confirmed_at=today,
        )
        db.add(po2)
        db.commit()
        db.refresh(po2)
        po2_items = [
            {"po_id": po2.id, "pr_id": pr2.id, "material_id": mat_objs[3].id, "quantity": 2,
             "unit_price": 420.00, "quote_id": quote_objs[6].id,
             "subtotal": 840.00, "tax_rate": 13.0, "tax_amount": 109.20, "total": 949.20,
             "delivered_qty": 0},
        ]
        for item in po2_items:
            db.add(models.PurchaseOrderItem(**item))
        db.commit()

        print("Creating sample audit logs...")
        audit_entries = [
            {"action": "create", "entity_type": "material", "entity_id": mat_objs[0].id,
             "entity_name": mat_objs[0].name, "user_id": admin_user.id, "user_name": admin_user.full_name,
             "role": admin_user.role.value, "description": "创建耗材规格"},
            {"action": "create", "entity_type": "quote", "entity_id": quote_objs[0].id,
             "entity_name": quote_objs[0].quote_no, "user_id": procurement_user.id,
             "user_name": procurement_user.full_name, "role": procurement_user.role.value,
             "description": "录入供应商报价"},
            {"action": "approve", "entity_type": "purchase_request", "entity_id": pr1.id,
             "entity_name": pr1.pr_no, "user_id": manager_user.id,
             "user_name": manager_user.full_name, "role": manager_user.role.value,
             "description": "审批采购需求"},
        ]
        for entry in audit_entries:
            log = models.AuditLog(**entry)
            db.add(log)

        print("Creating notifications...")
        notifications = [
            {"user_id": project_user.id, "alert_type": models.AlertType.DELIVERY_DATE_CHANGE,
             "title": "交期变更提醒: PO202401010001",
             "content": "订单预计提前1天交货，请做好收货准备",
             "related_entity_type": "purchase_order", "related_entity_id": po1.id},
            {"user_id": manager_user.id, "alert_type": models.AlertType.PRICE_ABNORMAL,
             "title": "价格异常提醒: A4复印纸",
             "content": "某供应商报价偏离历史均价达15%，请关注",
             "related_entity_type": "quote", "related_entity_id": quote_objs[1].id},
            {"user_id": procurement_user.id, "alert_type": models.AlertType.SUPPLIER_RISK,
             "title": "供应商风险提醒: 问题供应商有限公司",
             "content": "该供应商风险等级调整为高风险，建议暂停合作",
             "related_entity_type": "supplier", "related_entity_id": sup_objs[4].id},
        ]
        for notif in notifications:
            db.add(models.Notification(**notif))

        db.commit()
        print("\n=== 初始化完成 ===")
        print("\n默认账号:")
        print("  admin / admin123      (系统管理员)")
        print("  manager / manager123  (采购经理)")
        print("  procurement / proc123 (采购专员)")
        print("  frontline / front123  (行政专员/一线)")
        print("  project / proj123     (项目负责人)")
        print(f"\n初始化数据:")
        print(f"  {len(cat_objs)} 个耗材分类")
        print(f"  {len(mat_objs)} 种耗材规格")
        print(f"  {len(sup_objs)} 家供应商")
        print(f"  {len(quote_objs)} 条报价记录")
        print(f"  {len(agree_objs)} 份框架协议")
        print(f"  2 份采购需求")
        print(f"  2 份采购订单")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    print("开始初始化数据库...")
    init_database()
    print("数据库初始化完成!")
