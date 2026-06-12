import asyncio
from app.database import async_session, init_db
from app.models import User, RoleEnum
from app.services.auth_service import get_password_hash


async def seed():
    await init_db()
    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.username == "admin"))
        if result.scalar_one_or_none():
            print("种子数据已存在，跳过")
            return

        users = [
            User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                display_name="系统管理员",
                email="admin@qinghe.local",
                role=RoleEnum.admin,
            ),
            User(
                username="security",
                hashed_password=get_password_hash("security123"),
                display_name="安全负责人",
                email="security@qinghe.local",
                role=RoleEnum.security_officer,
            ),
            User(
                username="operator1",
                hashed_password=get_password_hash("operator123"),
                display_name="运维工程师-张三",
                email="zhangsan@qinghe.local",
                role=RoleEnum.operator,
            ),
            User(
                username="operator2",
                hashed_password=get_password_hash("operator123"),
                display_name="运维工程师-李四",
                email="lisi@qinghe.local",
                role=RoleEnum.operator,
            ),
            User(
                username="requester",
                hashed_password=get_password_hash("requester123"),
                display_name="普通申请人-王五",
                email="wangwu@qinghe.local",
                role=RoleEnum.requester,
            ),
        ]
        session.add_all(users)
        await session.commit()
        print("种子数据创建完成")
        print("  admin / admin123 (管理员)")
        print("  security / security123 (安全负责人)")
        print("  operator1 / operator123 (运维)")
        print("  operator2 / operator123 (运维)")
        print("  requester / requester123 (申请人)")


if __name__ == "__main__":
    asyncio.run(seed())
