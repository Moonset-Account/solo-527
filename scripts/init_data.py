import asyncio
import sys
from datetime import datetime, date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import async_session_maker, engine, Base
from app.core.security import hash_password, is_test_account
from app.models.models import (
    User, UserRole, Store, Staff, Service, Package, PackageItem,
    Cage, CageStatus, Vaccine, SystemConfig, ConfigType,
    Pet, PetType
)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        print("🚀 开始初始化数据...")

        admin = User(
            username="admin",
            email="admin@petgrooming.com",
            hashed_password=hash_password("admin123"),
            full_name="系统管理员",
            phone="13800000000",
            role=UserRole.ADMIN,
            is_test_account=False,
            is_active=True,
        )
        db.add(admin)
        await db.flush()
        print("✅ 创建管理员账号: admin / admin123")

        test_admin = User(
            username="test_admin",
            email="test_admin@test.petgrooming.local",
            hashed_password=hash_password("test123"),
            full_name="测试管理员",
            role=UserRole.ADMIN,
            is_test_account=True,
            is_active=True,
        )
        db.add(test_admin)
        await db.flush()
        print("✅ 创建测试管理员账号: test_admin / test123 (标记为测试账号)")

        manager = User(
            username="manager",
            email="manager@petgrooming.com",
            hashed_password=hash_password("manager123"),
            full_name="张店长",
            phone="13800000001",
            role=UserRole.MANAGER,
            is_test_account=False,
            is_active=True,
        )
        db.add(manager)
        await db.flush()
        print("✅ 创建店长账号: manager / manager123")

        test_manager = User(
            username="test_manager",
            email="test_manager@test.petgrooming.local",
            hashed_password=hash_password("test123"),
            full_name="测试店长",
            role=UserRole.MANAGER,
            is_test_account=True,
            is_active=True,
        )
        db.add(test_manager)
        await db.flush()

        staff_user = User(
            username="staff",
            email="staff@petgrooming.com",
            hashed_password=hash_password("staff123"),
            full_name="李美容师",
            phone="13800000002",
            role=UserRole.STAFF,
            is_test_account=False,
            is_active=True,
        )
        db.add(staff_user)
        await db.flush()
        print("✅ 创建员工账号: staff / staff123")

        customer = User(
            username="customer",
            email="customer@petgrooming.com",
            hashed_password=hash_password("customer123"),
            full_name="王先生",
            phone="13900000001",
            role=UserRole.CUSTOMER,
            is_test_account=False,
            is_active=True,
        )
        db.add(customer)
        await db.flush()
        print("✅ 创建客户账号: customer / customer123")

        test_customer = User(
            username="test_customer",
            email="test_customer@test.petgrooming.local",
            hashed_password=hash_password("test123"),
            full_name="测试客户",
            role=UserRole.CUSTOMER,
            is_test_account=True,
            is_active=True,
        )
        db.add(test_customer)
        await db.flush()

        store = Store(
            name="萌宠洗护总店",
            address="北京市朝阳区宠物街88号",
            phone="010-88888888",
            manager_id=manager.id,
        )
        db.add(store)
        await db.flush()
        print("✅ 创建门店: 萌宠洗护总店")

        staff = Staff(
            user_id=staff_user.id,
            store_id=store.id,
            position="高级美容师",
            specialties=["宠物洗澡", "宠物造型", "SPA护理"],
            is_active=True,
        )
        db.add(staff)

        manager_staff = Staff(
            user_id=manager.id,
            store_id=store.id,
            position="店长",
            specialties=["管理", "客户服务"],
            is_active=True,
        )
        db.add(manager_staff)

        admin.store_id = store.id
        manager.store_id = store.id
        staff_user.store_id = store.id

        services_data = [
            {"name": "基础洗澡", "description": "包括清洗、吹干、基础梳理", "duration_minutes": 60, "price": 88.0, "category": "基础护理"},
            {"name": "精致造型", "description": "专业造型修剪，个性化设计", "duration_minutes": 120, "price": 188.0, "category": "美容造型"},
            {"name": "SPA护理", "description": "深层滋养毛发，皮肤护理", "duration_minutes": 90, "price": 168.0, "category": "SPA护理"},
            {"name": "驱虫服务", "description": "体内外驱虫处理", "duration_minutes": 30, "price": 120.0, "category": "健康护理"},
            {"name": "指甲修剪", "description": "指甲修剪和打磨", "duration_minutes": 20, "price": 30.0, "category": "基础护理"},
            {"name": "耳道清洁", "description": "专业耳道清洁护理", "duration_minutes": 25, "price": 40.0, "category": "基础护理"},
        ]
        created_services = []
        for svc in services_data:
            service = Service(**svc, is_active=True)
            db.add(service)
            created_services.append(service)
        await db.flush()
        print(f"✅ 创建 {len(created_services)} 个服务项目")

        package1 = Package(
            name="新手洗护套",
            description="适合首次体验的客户，包含基础洗澡和指甲修剪",
            price=99.0,
            original_price=118.0,
            valid_days=90,
            is_active=True,
        )
        db.add(package1)
        await db.flush()
        db.add(PackageItem(package_id=package1.id, service_id=created_services[0].id, quantity=1))
        db.add(PackageItem(package_id=package1.id, service_id=created_services[4].id, quantity=1))

        package2 = Package(
            name="月度美容卡",
            description="一月4次基础洗澡，超值优惠",
            price=299.0,
            original_price=352.0,
            valid_days=30,
            is_active=True,
        )
        db.add(package2)
        await db.flush()
        db.add(PackageItem(package_id=package2.id, service_id=created_services[0].id, quantity=4))

        package3 = Package(
            name="豪华SPA套餐",
            description="SPA护理+精致造型+耳道清洁，全方位呵护",
            price=358.0,
            original_price=396.0,
            valid_days=180,
            is_active=True,
        )
        db.add(package3)
        await db.flush()
        db.add(PackageItem(package_id=package3.id, service_id=created_services[2].id, quantity=1))
        db.add(PackageItem(package_id=package3.id, service_id=created_services[1].id, quantity=1))
        db.add(PackageItem(package_id=package3.id, service_id=created_services[5].id, quantity=1))
        print("✅ 创建 3 个优惠套餐")

        cages_data = [
            {"name": "A01", "cage_type": "小型犬", "max_weight": 10.0, "location": "A区-1号"},
            {"name": "A02", "cage_type": "小型犬", "max_weight": 10.0, "location": "A区-2号"},
            {"name": "A03", "cage_type": "小型犬", "max_weight": 10.0, "location": "A区-3号"},
            {"name": "B01", "cage_type": "中型犬", "max_weight": 25.0, "location": "B区-1号"},
            {"name": "B02", "cage_type": "中型犬", "max_weight": 25.0, "location": "B区-2号"},
            {"name": "C01", "cage_type": "大型犬", "max_weight": 50.0, "location": "C区-1号"},
            {"name": "C02", "cage_type": "大型犬", "max_weight": 50.0, "location": "C区-2号"},
            {"name": "D01", "cage_type": "猫", "max_weight": 8.0, "location": "D区-猫舍"},
            {"name": "D02", "cage_type": "猫", "max_weight": 8.0, "location": "D区-猫舍"},
            {"name": "D03", "cage_type": "猫", "max_weight": 8.0, "location": "D区-猫舍"},
        ]
        for cage in cages_data:
            db.add(Cage(**cage, store_id=store.id, status=CageStatus.AVAILABLE, is_active=True))
        print(f"✅ 创建 {len(cages_data)} 个笼位")

        vaccines_data = [
            {"name": "犬四联疫苗", "description": "预防犬瘟热、细小病毒等", "manufacturer": "硕腾"},
            {"name": "犬六联疫苗", "description": "预防六种犬类传染病", "manufacturer": "英特威"},
            {"name": "狂犬疫苗", "description": "预防狂犬病", "manufacturer": "默沙东"},
            {"name": "猫三联疫苗", "description": "预防猫瘟、猫鼻支等", "manufacturer": "硕腾"},
        ]
        for v in vaccines_data:
            db.add(Vaccine(**v, is_active=True))
        print(f"✅ 创建 {len(vaccines_data)} 种疫苗")

        configs_data = [
            {
                "config_type": ConfigType.BOARDING_CAGE,
                "name": "小型犬寄养配置",
                "description": "体重10kg以下犬只适用",
                "config_value": {"daily_rate": 60, "max_weight": 10, "cage_type": "小型犬"},
                "conditions": {"pet_type": "dog"},
                "priority": 10,
            },
            {
                "config_type": ConfigType.BOARDING_CAGE,
                "name": "中型犬寄养配置",
                "description": "体重10-25kg犬只适用",
                "config_value": {"daily_rate": 100, "min_weight": 10, "max_weight": 25, "cage_type": "中型犬"},
                "conditions": {"pet_type": "dog"},
                "priority": 9,
            },
            {
                "config_type": ConfigType.BOARDING_CAGE,
                "name": "猫咪寄养配置",
                "description": "猫咪专属笼位配置",
                "config_value": {"daily_rate": 50, "cage_type": "猫"},
                "conditions": {"pet_type": "cat"},
                "priority": 10,
            },
            {
                "config_type": ConfigType.HEALTH_CHANGE,
                "name": "体温异常判定",
                "description": "狗狗体温超过39.5℃或低于37.5℃判定为异常",
                "config_value": {"temp_high": 39.5, "temp_low": 37.5},
                "conditions": {"pet_type": "dog"},
                "priority": 10,
            },
            {
                "config_type": ConfigType.HEALTH_CHANGE,
                "name": "体重骤变预警",
                "description": "7天内体重变化超过10%触发预警",
                "config_value": {"weight_change_percent": 10, "days": 7},
                "conditions": {},
                "priority": 8,
            },
            {
                "config_type": ConfigType.VACCINE_ALLERGY,
                "name": "轻度过敏处理",
                "description": "出现皮疹、瘙痒等轻度过敏反应",
                "config_value": {"severity": "mild", "action": "观察并给予抗组胺药物", "monitor_hours": 24},
                "conditions": {},
                "priority": 5,
            },
            {
                "config_type": ConfigType.VACCINE_ALLERGY,
                "name": "严重过敏处理",
                "description": "出现呼吸急促、面部肿胀等严重过敏反应",
                "config_value": {"severity": "severe", "action": "立即注射肾上腺素并送医", "monitor_hours": 72},
                "conditions": {},
                "priority": 10,
            },
            {
                "config_type": ConfigType.REPURCHASE_RULE,
                "name": "24小时内重复预约",
                "description": "24小时内重复预约判定为异常",
                "config_value": {"min_days": 0, "max_days": 1, "anomaly_type": "too_frequent", "description": "复购间隔过短（24小时内重复预约）"},
                "conditions": {},
                "priority": 10,
            },
            {
                "config_type": ConfigType.REPURCHASE_RULE,
                "name": "超90天未复购",
                "description": "超过90天未复购判定为异常",
                "config_value": {"min_days": 90, "max_days": 99999, "anomaly_type": "too_infrequent", "description": "复购间隔过长（超过90天未复购）"},
                "conditions": {},
                "priority": 8,
            },
        ]
        for cfg in configs_data:
            db.add(SystemConfig(
                **cfg,
                is_active=True,
                created_by=admin.id,
                valid_from=date.today(),
            ))
        print(f"✅ 创建 {len(configs_data)} 条系统配置规则")

        pet = Pet(
            owner_id=customer.id,
            name="旺财",
            pet_type=PetType.DOG,
            breed="金毛",
            weight=25.0,
            age=3,
            gender="male",
            notes="性格温顺，喜欢人类",
            is_active=True,
        )
        db.add(pet)

        pet2 = Pet(
            owner_id=customer.id,
            name="咪咪",
            pet_type=PetType.CAT,
            breed="布偶",
            weight=4.5,
            age=2,
            gender="female",
            notes="比较怕生，需要慢慢接触",
            is_active=True,
        )
        db.add(pet2)
        print("✅ 创建 2 只示例宠物")

        await db.commit()
        print("\n🎉 数据初始化完成！")
        print("\n📋 登录账号：")
        print("   管理员: admin / admin123")
        print("   店  长: manager / manager123")
        print("   员  工: staff / staff123")
        print("   客  户: customer / customer123")
        print("\n🧪 测试账号（数据不计入业务统计）：")
        print("   测试管理员: test_admin / test123")
        print("   测试店长: test_manager / test123")
        print("   测试客户: test_customer / test123")


if __name__ == "__main__":
    asyncio.run(init_db())
