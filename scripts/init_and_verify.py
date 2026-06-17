import asyncio
import sys
import os
from datetime import date, time, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_maker, engine, Base
from app.core.security import hash_password, is_test_account
from sqlalchemy import select, func, cast, Date, Integer, String, case as sql_case
from app.models.models import (
    User, UserRole, Store, Staff, Service, Package, PackageItem,
    Cage, CageStatus, Vaccine, SystemConfig, ConfigType,
    Pet, PetType, Appointment, AppointmentStatus, AppointmentService,
    HealthRecord, HealthStatus, RepurchaseAnomaly
)


async def init_and_verify():
    print("=" * 60)
    print("🚀 开始初始化数据和验证")
    print("=" * 60)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ 数据库表创建完成")

    async with async_session_maker() as db:
        print("\n📝 初始化基础数据...")
        today = date.today()

        admin = User(
            username="admin",
            email="admin@petgrooming.local",
            hashed_password=hash_password("admin123"),
            full_name="系统管理员",
            phone="13800138000",
            role=UserRole.ADMIN,
            is_test_account=is_test_account("admin", "admin@petgrooming.local"),
            is_active=True,
        )
        db.add(admin)

        manager = User(
            username="manager",
            email="manager@petgrooming.local",
            hashed_password=hash_password("manager123"),
            full_name="张店长",
            phone="13800138001",
            role=UserRole.MANAGER,
            is_test_account=is_test_account("manager", "manager@petgrooming.local"),
            is_active=True,
        )
        db.add(manager)

        staff_user = User(
            username="staff",
            email="staff@petgrooming.local",
            hashed_password=hash_password("staff123"),
            full_name="李员工",
            phone="13800138002",
            role=UserRole.STAFF,
            is_test_account=is_test_account("staff", "staff@petgrooming.local"),
            is_active=True,
        )
        db.add(staff_user)

        customer = User(
            username="customer",
            email="customer@petgrooming.local",
            hashed_password=hash_password("customer123"),
            full_name="王客户",
            phone="13900139000",
            role=UserRole.CUSTOMER,
            is_test_account=is_test_account("customer", "customer@petgrooming.local"),
            is_active=True,
        )
        db.add(customer)
        await db.flush()
        print("✅ 创建 4 个用户账号")

        store = Store(
            name="萌宠乐园旗舰店",
            address="北京市朝阳区宠物街88号",
            phone="010-12345678",
            manager_id=manager.id,
        )
        db.add(store)
        await db.flush()
        print(f"✅ 创建门店: {store.name}, 店长: {manager.full_name}")

        staff = Staff(
            user_id=staff_user.id,
            store_id=store.id,
            position="宠物美容师",
            specialties=["dog_grooming", "cat_grooming"],
            is_active=True,
        )
        db.add(staff)
        print("✅ 创建员工档案")

        services_data = [
            {"name": "基础洗护", "description": "洗澡、吹干、梳毛", "price": 88.0, "duration_minutes": 60, "pet_type": PetType.DOG, "is_active": True},
            {"name": "精致洗护", "description": "基础洗护+造型修剪", "price": 188.0, "duration_minutes": 120, "pet_type": PetType.DOG, "is_active": True},
            {"name": "SPA护理", "description": "精油按摩+深层护理", "price": 168.0, "duration_minutes": 90, "pet_type": PetType.DOG, "is_active": True},
            {"name": "猫咪基础洗护", "description": "猫咪专用洗澡护理", "price": 128.0, "duration_minutes": 60, "pet_type": PetType.CAT, "is_active": True},
            {"name": "猫咪造型", "description": "猫咪造型修剪", "price": 198.0, "duration_minutes": 90, "pet_type": PetType.CAT, "is_active": True},
            {"name": "宠物美容", "description": "专业造型设计", "price": 228.0, "duration_minutes": 150, "pet_type": PetType.DOG, "is_active": True},
        ]
        services = []
        for s in services_data:
            svc = Service(name=s["name"], description=s["description"], duration_minutes=s["duration_minutes"], price=s["price"], is_active=s["is_active"], created_by=admin.id)
            db.add(svc)
            services.append(svc)
        print(f"✅ 创建 {len(services)} 个服务项目")

        packages_data = [
            {"name": "狗狗月度护理套餐", "description": "包含4次基础洗护", "price": 300.0, "total_uses": 4, "pet_type": PetType.DOG, "is_active": True},
            {"name": "猫咪季度护理套餐", "description": "包含3次猫咪洗护", "price": 350.0, "total_uses": 3, "pet_type": PetType.CAT, "is_active": True},
            {"name": "VIP全能套餐", "description": "包含洗护、美容、SPA各一次", "price": 500.0, "total_uses": 3, "pet_type": PetType.DOG, "is_active": True},
        ]
        for idx, p in enumerate(packages_data):
            pkg = Package(**p, created_by=admin.id)
            db.add(pkg)
            await db.flush()
            if idx == 0:
                for svc_id in [1]:
                    db.add(PackageItem(package_id=pkg.id, service_id=svc_id, quantity=4))
            elif idx == 1:
                for svc_id in [4]:
                    db.add(PackageItem(package_id=pkg.id, service_id=svc_id, quantity=3))
            else:
                for svc_id in [1, 6, 3]:
                    db.add(PackageItem(package_id=pkg.id, service_id=svc_id, quantity=1))
        print(f"✅ 创建 {len(packages_data)} 个套餐")

        cages_data = []
        for i in range(1, 8):
            cages_data.append({"name": f"D{i:02d}", "cage_type": "小型犬", "max_weight": 10.0, "location": f"A区-{i}", "status": CageStatus.AVAILABLE, "store_id": store.id, "is_active": True})
        for i in range(1, 4):
            cages_data.append({"name": f"D{i:02d}", "cage_type": "中型犬", "max_weight": 25.0, "location": f"B区-{i}", "status": CageStatus.AVAILABLE, "store_id": store.id, "is_active": True})
        for i in range(1, 4):
            cages_data.append({"name": f"C{i:02d}", "cage_type": "猫", "max_weight": 8.0, "location": f"D区-猫舍", "status": CageStatus.AVAILABLE, "store_id": store.id, "is_active": True})
        for c in cages_data:
            db.add(Cage(**c))
        print(f"✅ 创建 {len(cages_data)} 个笼位")

        vaccines_data = [
            {"name": "犬四联疫苗", "description": "预防犬瘟热、细小病毒等", "manufacturer": "硕腾"},
            {"name": "犬六联疫苗", "description": "预防六种犬类传染病", "manufacturer": "英特威"},
            {"name": "狂犬疫苗", "description": "预防狂犬病", "manufacturer": "默沙东"},
            {"name": "猫三联疫苗", "description": "预防猫瘟、猫鼻支等", "manufacturer": "硕腾"},
        ]
        for v in vaccines_data:
            db.add(Vaccine(**v))
        print(f"✅ 创建 {len(vaccines_data)} 种疫苗")

        configs_data = [
            {"config_type": ConfigType.BOARDING_CAGE, "name": "小型犬寄养配置", "description": "体重10kg以下犬只适用", "config_value": {"daily_rate": 60, "max_weight": 10, "cage_type": "小型犬"}, "conditions": {"pet_type": "dog"}, "priority": 10},
            {"config_type": ConfigType.BOARDING_CAGE, "name": "中型犬寄养配置", "description": "体重10-25kg犬只适用", "config_value": {"daily_rate": 100, "min_weight": 10, "max_weight": 25, "cage_type": "中型犬"}, "conditions": {"pet_type": "dog"}, "priority": 9},
            {"config_type": ConfigType.BOARDING_CAGE, "name": "猫咪寄养配置", "description": "猫咪专属笼位配置", "config_value": {"daily_rate": 50, "cage_type": "猫"}, "conditions": {"pet_type": "cat"}, "priority": 10},
            {"config_type": ConfigType.HEALTH_CHANGE, "name": "体温异常判定", "description": "狗狗体温超过39.5℃或低于37.5℃判定为异常", "config_value": {"temp_high": 39.5, "temp_low": 37.5}, "conditions": {"pet_type": "dog"}, "priority": 10},
            {"config_type": ConfigType.HEALTH_CHANGE, "name": "体重骤变预警", "description": "7天内体重变化超过10%触发预警", "config_value": {"weight_change_percent": 10, "days": 7}, "conditions": {}, "priority": 8},
            {"config_type": ConfigType.VACCINE_ALLERGY, "name": "轻度过敏处理", "description": "出现皮疹、瘙痒等轻度过敏反应", "config_value": {"severity": "mild", "action": "观察并给予抗组胺药物", "monitor_hours": 24}, "conditions": {}, "priority": 5},
            {"config_type": ConfigType.VACCINE_ALLERGY, "name": "严重过敏处理", "description": "出现呼吸急促、面部肿胀等严重过敏反应", "config_value": {"severity": "severe", "action": "立即注射肾上腺素并送医", "monitor_hours": 72}, "conditions": {}, "priority": 10},
            {"config_type": ConfigType.REPURCHASE_RULE, "name": "24小时内重复预约", "description": "24小时内重复预约判定为异常", "config_value": {"min_days": 0, "max_days": 1, "anomaly_type": "too_frequent", "description": "复购间隔过短（24小时内重复预约）"}, "conditions": {}, "priority": 10},
            {"config_type": ConfigType.REPURCHASE_RULE, "name": "超90天未复购", "description": "超过90天未复购判定为异常", "config_value": {"min_days": 90, "max_days": 99999, "anomaly_type": "too_infrequent", "description": "复购间隔过长（超过90天未复购）"}, "conditions": {}, "priority": 8},
        ]
        for c in configs_data:
            db.add(SystemConfig(**c, is_active=True, valid_from=today, created_by=admin.id))
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
        await db.flush()
        print("✅ 创建 2 只示例宠物")

        print("\n📝 创建示例预约和健康记录...")
        appointments_data = [
            {"date": today - timedelta(days=10), "start_time": time(10, 0), "end_time": time(11, 0), "status": AppointmentStatus.COMPLETED, "total_price": 88.0, "services": [1]},
            {"date": today - timedelta(days=5), "start_time": time(14, 0), "end_time": time(15, 0), "status": AppointmentStatus.COMPLETED, "total_price": 188.0, "services": [2]},
            {"date": today, "start_time": time(9, 0), "end_time": time(10, 30), "status": AppointmentStatus.CONFIRMED, "total_price": 168.0, "services": [3]},
        ]

        created_appointments = []
        for idx, appt_data in enumerate(appointments_data):
            appt = Appointment(
                customer_id=customer.id,
                pet_id=pet.id if idx % 2 == 0 else pet2.id,
                store_id=store.id,
                appointment_date=appt_data["date"],
                start_time=appt_data["start_time"],
                end_time=appt_data["end_time"],
                status=appt_data["status"],
                total_price=appt_data["total_price"],
                is_test_data=False,
            )
            db.add(appt)
            await db.flush()
            created_appointments.append(appt)

            for svc_id in appt_data["services"]:
                svc_result = await db.execute(select(Service).where(Service.id == svc_id))
                svc = svc_result.scalar_one_or_none()
                if svc:
                    db.add(AppointmentService(
                        appointment_id=appt.id,
                        service_id=svc.id,
                        price_at_time=svc.price,
                    ))
        print(f"✅ 创建 {len(created_appointments)} 条示例预约")

        health_records_data = [
            {
                "pet_id": pet.id,
                "appointment_id": created_appointments[0].id,
                "staff_id": staff_user.id,
                "store_id": store.id,
                "record_date": today - timedelta(days=10),
                "health_status": HealthStatus.NORMAL,
                "temperature": 38.5,
                "weight": 25.0,
            },
            {
                "pet_id": pet.id,
                "appointment_id": created_appointments[1].id,
                "staff_id": staff_user.id,
                "store_id": store.id,
                "record_date": today - timedelta(days=5),
                "health_status": HealthStatus.ABNORMAL,
                "abnormal_reason": "皮肤过敏",
                "temperature": 38.7,
                "weight": 24.8,
                "symptoms": "背部毛发脱落、皮肤发红",
                "treatment": "外用抗真菌药膏，建议药浴",
            },
            {
                "pet_id": pet2.id,
                "staff_id": staff_user.id,
                "store_id": store.id,
                "record_date": today - timedelta(days=3),
                "health_status": HealthStatus.CRITICAL,
                "abnormal_reason": "食欲不振伴呕吐",
                "temperature": 39.8,
                "weight": 4.2,
                "symptoms": "连续2天呕吐，精神萎靡",
                "treatment": "输液治疗，禁食24小时观察",
            },
            {
                "pet_id": pet.id,
                "staff_id": staff_user.id,
                "store_id": store.id,
                "record_date": today,
                "health_status": HealthStatus.ABNORMAL,
                "abnormal_reason": "皮肤过敏",
                "temperature": 38.6,
                "weight": 24.9,
                "symptoms": "瘙痒，抓挠频繁",
                "treatment": "口服抗过敏药，药浴护理",
            },
            {
                "pet_id": pet2.id,
                "staff_id": staff_user.id,
                "store_id": store.id,
                "record_date": today,
                "health_status": HealthStatus.NORMAL,
                "temperature": 38.2,
                "weight": 4.4,
            },
        ]

        for hr_data in health_records_data:
            db.add(HealthRecord(
                **hr_data,
                is_test_data=False,
            ))
        print(f"✅ 创建 {len(health_records_data)} 条示例健康记录")

        await db.commit()

        print("\n" + "=" * 60)
        print("🔍 验证双外键关系（Appointment <-> RepurchaseAnomaly）")
        print("=" * 60)

        test_appt1 = created_appointments[0]
        test_appt2 = created_appointments[1]

        anomaly = RepurchaseAnomaly(
            appointment_id=test_appt2.id,
            customer_id=customer.id,
            anomaly_type="too_frequent",
            description="测试复购异常",
            rule_triggered="24小时内重复预约",
            previous_appointment_id=test_appt1.id,
            gap_days=5,
            is_test_data=False,
        )
        db.add(anomaly)
        await db.flush()

        result = await db.execute(
            select(RepurchaseAnomaly)
            .where(RepurchaseAnomaly.id == anomaly.id)
        )
        saved_anomaly = result.scalar_one()

        assert saved_anomaly.appointment_id == test_appt2.id
        assert saved_anomaly.previous_appointment_id == test_appt1.id
        print("✅ 双外键关系映射正常")
        print(f"   - anomaly.appointment_id = {saved_anomaly.appointment_id}")
        print(f"   - anomaly.previous_appointment_id = {saved_anomaly.previous_appointment_id}")

        result = await db.execute(
            select(Appointment)
            .where(Appointment.id == test_appt2.id)
        )
        appt_with_anomaly = result.scalar_one()
        print(f"✅ 反向关系可用: Appointment.repurchase_anomaly.appointment_id = {appt_with_anomaly.repurchase_anomaly.appointment_id}")

        await db.commit()

        print("\n" + "=" * 60)
        print("📊 验证健康统计接口（三维度拆分）")
        print("=" * 60)

        group_cols = [Store.id, Store.name, User.full_name, HealthRecord.record_date, HealthRecord.abnormal_reason]
        select_cols = [
            Store.id.label("store_id"),
            Store.name.label("store_name"),
            User.full_name.label("manager_name"),
            HealthRecord.record_date.label("date"),
            HealthRecord.abnormal_reason,
            func.count(HealthRecord.id).label("total_count"),
            func.sum(sql_case((HealthRecord.health_status == HealthStatus.ABNORMAL, 1), else_=0)).label("abnormal_count"),
            func.sum(sql_case((HealthRecord.health_status == HealthStatus.CRITICAL, 1), else_=0)).label("critical_count"),
        ]

        query = (
            select(*select_cols)
            .outerjoin(Store, HealthRecord.store_id == Store.id)
            .outerjoin(User, Store.manager_id == User.id)
            .where(HealthRecord.is_test_data == False)
            .group_by(*group_cols)
            .order_by(Store.id, HealthRecord.record_date, HealthRecord.abnormal_reason)
        )

        result = await db.execute(query)
        stats = result.all()

        print(f"✅ 三维度拆分查询成功，返回 {len(stats)} 条记录")
        print("\n📋 结果样例（店长、日期、异常原因 三维度）：")
        print(f"{'门店':<12} {'店长':<10} {'日期':<12} {'异常原因':<18} {'总数':<6} {'异常':<6} {'危重':<6}")
        print("-" * 80)
        for row in stats:
            store_name = row.store_name or '-'
            manager_name = row.manager_name or '-'
            date_str = str(row.date) if row.date else '-'
            reason = row.abnormal_reason or '正常'
            print(f"{store_name:<12} {manager_name:<10} {date_str:<12} {reason:<18} {row.total_count:<6} {row.abnormal_count:<6} {row.critical_count:<6}")

        has_manager_name = any(row.manager_name for row in stats)
        print(f"\n✅ 店长名称字段{'已' if has_manager_name else '未'}正确返回")

        print("\n" + "=" * 60)
        print("🎉 所有验证通过！")
        print("=" * 60)
        print("\n📋 登录账号：")
        print("   管理员: admin / admin123")
        print("   店  长: manager / manager123")
        print("   员  工: staff / staff123")
        print("   客  户: customer / customer123")
        print("\n🌐 访问地址: http://localhost:8000")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_and_verify())
