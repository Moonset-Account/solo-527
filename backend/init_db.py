import asyncio
from sqlalchemy import text, select
from app.database import engine, Base, async_session
from app.models.models import (
    User, Customer, Plan, BudgetVersion, Contract,
    AcceptanceTemplate, InspectionTemplate, InspectionTask,
    InspectionRecord, SatisfactionRecord, Notification, ConfigChangeLog,
)
from app.services.auth_service import hash_password


async def create_database_if_not_exists():
    import psycopg2
    from app.config import settings

    db_name = settings.DATABASE_URL.split("/")[-1]
    base_url = settings.DATABASE_URL.rsplit("/", 1)[0] + "/postgres"

    try:
        conn = psycopg2.connect(base_url)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cur.fetchone()
        if not exists:
            cur.execute(f"CREATE DATABASE {db_name}")
            print(f"Database '{db_name}' created successfully")
        else:
            print(f"Database '{db_name}' already exists")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Warning: Could not create database: {e}")
        print("Please make sure PostgreSQL is running and the database exists")


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully")


async def create_initial_users():
    async with async_session() as session:
        try:
            initial_users = [
                {
                    "username": "admin",
                    "password": "admin123",
                    "role": "admin",
                    "display_name": "系统管理员",
                    "is_demo": False,
                },
                {
                    "username": "inspector01",
                    "password": "inspector123",
                    "role": "inspector",
                    "display_name": "质检员李工",
                    "is_demo": False,
                },
                {
                    "username": "inspector02",
                    "password": "inspector123",
                    "role": "inspector",
                    "display_name": "质检员王工",
                    "is_demo": False,
                },
                {
                    "username": "material01",
                    "password": "material123",
                    "role": "material_staff",
                    "display_name": "材料员张姐",
                    "is_demo": False,
                },
            ]

            for user_data in initial_users:
                result = await session.execute(
                    select(User).where(User.username == user_data["username"])
                )
                existing = result.scalar_one_or_none()
                if not existing:
                    user = User(
                        username=user_data["username"],
                        password_hash=hash_password(user_data["password"]),
                        role=user_data["role"],
                        display_name=user_data["display_name"],
                        is_demo=user_data["is_demo"],
                    )
                    session.add(user)
                    print(f"Created user: {user_data['username']} ({user_data['role']})")
                else:
                    print(f"User already exists: {user_data['username']}")

            await session.commit()
            print("Initial users setup completed")
        except Exception as e:
            await session.rollback()
            print(f"Error creating initial users: {e}")
            raise


async def create_initial_templates():
    async with async_session() as session:
        try:
            at_result = await session.execute(select(AcceptanceTemplate).limit(1))
            if not at_result.scalar_one_or_none():
                at1 = AcceptanceTemplate(
                    name="标准验收模板",
                    items=["水电线路检查", "墙面平整度", "地面平整度", "防水测试", "门窗安装"],
                    is_demo=False,
                )
                at2 = AcceptanceTemplate(
                    name="精装修验收模板",
                    items=["水电验收", "泥瓦验收", "木工验收", "油漆验收", "安装工程验收", "整体空气质量检测"],
                    is_demo=False,
                )
                session.add_all([at1, at2])
                print("Created acceptance templates")

            it_result = await session.execute(select(InspectionTemplate).limit(1))
            if not it_result.scalar_one_or_none():
                it1 = InspectionTemplate(
                    name="水电巡检模板",
                    check_items=["电路布线规范", "水管压力测试", "开关插座位置", "灯具安装", "配电箱接线"],
                    is_demo=False,
                )
                it2 = InspectionTemplate(
                    name="泥瓦巡检模板",
                    check_items=["墙砖空鼓检查", "地砖空鼓检查", "墙面平整度", "地面坡度", "防水闭水试验"],
                    is_demo=False,
                )
                it3 = InspectionTemplate(
                    name="木工巡检模板",
                    check_items=["柜体尺寸检查", "柜门平整度", "五金件安装", "吊顶龙骨检查", "造型尺寸核对"],
                    is_demo=False,
                )
                session.add_all([it1, it2, it3])
                print("Created inspection templates")

            plan_result = await session.execute(select(Plan).limit(1))
            if not plan_result.scalar_one_or_none():
                p1 = Plan(
                    name="标准装修方案",
                    description="三室两厅标准装修，包含水电、泥瓦、木工、油漆等全套施工，适合现代简约风格",
                    status="active",
                    is_demo=False,
                )
                p2 = Plan(
                    name="豪华装修方案",
                    description="四室两厅豪华装修，采用高端材料，全屋定制，适合追求品质的客户",
                    status="active",
                    is_demo=False,
                )
                p3 = Plan(
                    name="经济型装修方案",
                    description="两室一厅经济型装修，性价比高，满足基本居住需求",
                    status="active",
                    is_demo=False,
                )
                session.add_all([p1, p2, p3])
                print("Created initial plans")

            await session.commit()
            print("Initial templates setup completed")
        except Exception as e:
            await session.rollback()
            print(f"Error creating initial templates: {e}")
            raise


async def main():
    print("=" * 50)
    print("Starting database initialization...")
    print("=" * 50)

    await create_database_if_not_exists()
    await create_tables()
    await create_initial_users()
    await create_initial_templates()

    print("=" * 50)
    print("Database initialization completed successfully!")
    print("=" * 50)
    print("\nDefault login accounts:")
    print("  admin / admin123 (管理员)")
    print("  inspector01 / inspector123 (质检员)")
    print("  inspector02 / inspector123 (质检员)")
    print("  material01 / material123 (材料员)")
    print("\nYou can also seed demo data by calling POST /api/demo/seed")
    print("and clear demo data by calling DELETE /api/demo/clear")


if __name__ == "__main__":
    asyncio.run(main())
