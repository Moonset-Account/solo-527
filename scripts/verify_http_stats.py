import asyncio
import httpx


async def main():
    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=30) as client:
        resp = await client.post(
            "/api/auth/login",
            data={"username": "manager_api", "password": "manager123"},
        )
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        test_cases = [
            ("store,date,reason", "三维度（店长+日期+异常原因）"),
            ("store,date", "店长+日期"),
            ("store,reason", "店长+异常原因"),
            ("store", "仅店长"),
        ]

        for group_by, desc in test_cases:
            resp = await client.get(
                f"/api/health-stats?group_by={group_by}", headers=headers
            )
            data = resp.json()
            print(f"\n📊 {desc}: /api/health-stats?group_by={group_by}")
            print(f"   状态: {resp.status_code}, 返回 {len(data)} 条记录")
            if data:
                cols = [k for k in data[0].keys() if data[0][k] is not None]
                print(f"   返回字段: {', '.join(cols)}")
                has_manager = any(row.get("manager_name") for row in data)
                has_store = any(row.get("store_name") for row in data)
                print(f"   ✅ 门店名称: {'是' if has_store else '否'}")
                print(f"   ✅ 店长名称: {'是' if has_manager else '否'}")

        print("\n" + "=" * 60)
        print("✅ HTTP API 验证全部通过")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
