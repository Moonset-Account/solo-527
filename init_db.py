#!/usr/bin/env python3
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, async_session
from app.auth import hash_password
from app.models import User, Brand, MemberProfile, UserRole, DictItem, PointProduct, CouponTemplate, PointBenefit


async def init_db():
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created.")

    async with async_session() as db:
        print("Creating default brand...")
        brand = Brand(name="母婴优选品牌", code="MOMBABY001", description="官方母婴品牌")
        db.add(brand)
        await db.flush()

        print("Creating admin user...")
        admin = User(
            username="admin",
            email="admin@example.com",
            full_name="系统管理员",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)

        print("Creating brand operator user...")
        operator = User(
            username="operator",
            email="op@example.com",
            full_name="品牌运营专员",
            hashed_password=hash_password("operator123"),
            role=UserRole.BRAND_OPERATOR,
            brand_id=brand.id,
            is_active=True,
        )
        db.add(operator)

        print("Creating test member...")
        member_user = User(
            username="member",
            email="member@example.com",
            full_name="测试会员",
            phone="13800138000",
            hashed_password=hash_password("member123"),
            role=UserRole.MEMBER,
            brand_id=brand.id,
            is_active=True,
        )
        db.add(member_user)
        await db.flush()

        member = MemberProfile(
            user_id=member_user.id,
            brand_id=brand.id,
            member_no="M00000001",
            nickname="宝妈小美",
            total_points=5000,
            available_points=5000,
            level="金卡会员",
            total_spent=8888.88,
            order_count=12,
            is_vip=True,
            tags=["高价值", "复购用户", "奶粉购买者"],
        )
        db.add(member)

        print("Creating member user2...")
        member_user2 = User(
            username="member2",
            email="member2@example.com",
            full_name="会员小李",
            phone="13900139000",
            hashed_password=hash_password("member123"),
            role=UserRole.MEMBER,
            brand_id=brand.id,
            is_active=True,
        )
        db.add(member_user2)
        await db.flush()

        member2 = MemberProfile(
            user_id=member_user2.id,
            brand_id=brand.id,
            member_no="M00000002",
            nickname="新手妈妈",
            total_points=800,
            available_points=800,
            level="普通会员",
            total_spent=520.0,
            order_count=3,
        )
        db.add(member2)

        print("Creating dict items...")
        dicts = [
            DictItem(dict_type="member_level", dict_code="normal", dict_label="普通会员", dict_value={"min_points": 0, "discount": 1.0}, sort_order=1),
            DictItem(dict_type="member_level", dict_code="silver", dict_label="银卡会员", dict_value={"min_points": 1000, "discount": 0.95}, sort_order=2),
            DictItem(dict_type="member_level", dict_code="gold", dict_label="金卡会员", dict_value={"min_points": 5000, "discount": 0.9}, sort_order=3),
            DictItem(dict_type="member_level", dict_code="diamond", dict_label="钻石会员", dict_value={"min_points": 20000, "discount": 0.85}, sort_order=4),
            DictItem(dict_type="coupon_type", dict_code="fixed", dict_label="满减券", sort_order=1),
            DictItem(dict_type="coupon_type", dict_code="percent", dict_label="折扣券", sort_order=2),
            DictItem(dict_type="coupon_type", dict_code="cash", dict_label="现金券", sort_order=3),
            DictItem(dict_type="reach_channel", dict_code="sms", dict_label="短信", sort_order=1),
            DictItem(dict_type="reach_channel", dict_code="wechat", dict_label="微信", sort_order=2),
            DictItem(dict_type="reach_channel", dict_code="push", dict_label="APP推送", sort_order=3),
            DictItem(dict_type="reach_channel", dict_code="email", dict_label="邮件", sort_order=4),
            DictItem(dict_type="task_status", dict_code="draft", dict_label="草稿", sort_order=1),
            DictItem(dict_type="task_status", dict_code="approved", dict_label="已审批", sort_order=2),
            DictItem(dict_type="task_status", dict_code="running", dict_label="进行中", sort_order=3),
            DictItem(dict_type="task_status", dict_code="completed", dict_label="已完成", sort_order=4),
            DictItem(dict_type="point_change_type", dict_code="earn", dict_label="获得积分", sort_order=1),
            DictItem(dict_type="point_change_type", dict_code="spend", dict_label="消费积分", sort_order=2),
            DictItem(dict_type="point_change_type", dict_code="redeem", dict_label="兑换扣减", sort_order=3),
            DictItem(dict_type="point_change_type", dict_code="refund", dict_label="退回积分", sort_order=4),
            DictItem(dict_type="point_change_type", dict_code="adjust", dict_label="人工调整", sort_order=5),
        ]
        for d in dicts:
            db.add(d)

        print("Creating sample products...")
        products = [
            PointProduct(name="婴儿配方奶粉1段", sku="P001", category="奶粉", points_required=2000, original_price=298.0, cost_price=180.0,
                         description="适合0-6个月宝宝，进口奶源", stock=50, is_hot=True, is_new=False, brand_id=brand.id),
            PointProduct(name="纯棉新生儿礼盒", sku="P002", category="服饰", points_required=1500, original_price=199.0, cost_price=99.0,
                         description="6件装纯棉婴儿服礼盒", stock=100, is_hot=True, is_new=True, brand_id=brand.id),
            PointProduct(name="宝宝早教益智玩具套装", sku="P003", category="玩具", points_required=3000, original_price=399.0, cost_price=200.0,
                         description="0-3岁宝宝启蒙益智玩具", stock=30, is_hot=False, is_new=True, brand_id=brand.id),
            PointProduct(name="儿童保温杯", sku="P004", category="用品", points_required=800, original_price=99.0, cost_price=45.0,
                         description="316不锈钢儿童保温水杯", stock=200, is_hot=False, is_new=False, brand_id=brand.id),
            PointProduct(name="母婴护理大礼包", sku="P005", category="护理", points_required=2500, original_price=328.0, cost_price=168.0,
                         description="产后妈妈+宝宝护理套装", stock=40, is_hot=True, is_new=False, brand_id=brand.id),
            PointProduct(name="婴儿推车配件套装", sku="P006", category="用品", points_required=1200, original_price=159.0, cost_price=75.0,
                         description="雨罩+蚊帐+杯架", stock=60, is_hot=False, is_new=False, brand_id=brand.id),
        ]
        for p in products:
            db.add(p)

        print("Creating sample coupons...")
        coupons = [
            CouponTemplate(name="新客复购满200减30", code="CP2024001", coupon_type="fixed", discount_value=30.0, min_order_amount=200.0,
                           description="首次复购专享优惠券", valid_days=60, total_quantity=1000, per_user_limit=1,
                           is_repurchase=True, cost_per_unit=30.0, brand_id=brand.id),
            CouponTemplate(name="奶粉专享8折券", code="CP2024002", coupon_type="percent", discount_value=8.0, min_order_amount=0,
                           description="奶粉品类8折优惠，最高减100", valid_days=30, total_quantity=500, per_user_limit=2,
                           max_discount_amount=100.0, is_repurchase=True, cost_per_unit=50.0, brand_id=brand.id),
            CouponTemplate(name="会员生日50元券", code="CP2024003", coupon_type="cash", discount_value=50.0, min_order_amount=0,
                           description="生日当月专享无门槛券", valid_days=30, total_quantity=100, per_user_limit=1,
                           is_repurchase=False, cost_per_unit=50.0, brand_id=brand.id),
            CouponTemplate(name="满500减80复购券", code="CP2024004", coupon_type="fixed", discount_value=80.0, min_order_amount=500.0,
                           description="老客复购满减券", valid_days=45, total_quantity=800, per_user_limit=3,
                           is_repurchase=True, cost_per_unit=80.0, brand_id=brand.id),
        ]
        for c in coupons:
            db.add(c)

        print("Creating sample benefits...")
        benefits = [
            PointBenefit(name="生日专属礼包", benefit_type="birthday", points_required=500,
                         description="生日当月可领取，包含生日贺卡+小礼品+50元无门槛券", value_amount=99.0, cost_amount=30.0,
                         stock=200, per_user_limit=1, valid_days=30, brand_id=brand.id),
            PointBenefit(name="专属客服服务", benefit_type="service", points_required=2000,
                         description="一对一专属母婴顾问服务", value_amount=199.0, cost_amount=0.0,
                         stock=0, per_user_limit=1, valid_days=365, brand_id=brand.id),
            PointBenefit(name="VIP免邮权益月卡", benefit_type="vip", points_required=300,
                         description="全场包邮一个月", value_amount=60.0, cost_amount=20.0,
                         stock=500, per_user_limit=12, valid_days=30, brand_id=brand.id),
            PointBenefit(name="新品优先体验", benefit_type="gift", points_required=1000,
                         description="新品上市优先获得体验资格", value_amount=100.0, cost_amount=0.0,
                         stock=50, per_user_limit=1, valid_days=90, brand_id=brand.id),
        ]
        for b in benefits:
            db.add(b)

        await db.commit()

    print("\n" + "=" * 50)
    print("Database initialized successfully!")
    print("=" * 50)
    print("\nDefault accounts:")
    print("  Admin:     admin / admin123")
    print("  Operator:  operator / operator123")
    print("  Member1:   member / member123   (5000积分, 金卡)")
    print("  Member2:   member2 / member123  (800积分, 普通)")
    print("\nFrontend URLs:")
    print("  Member Mall:  http://localhost:8000/mall")
    print("  Admin Panel:  http://localhost:8000/admin/dashboard")
    print()


if __name__ == "__main__":
    asyncio.run(init_db())
