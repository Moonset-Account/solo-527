import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_login(username, password, desc):
    print(f"\n=== 测试 {desc} 账号登录 ===")
    print(f"  账号: {username} / {password}")
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/auth/login",
            data={"username": username, "password": password},
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "HX-Request": "true"
            }
        )
        
        print(f"  状态码: {response.status_code}")
        hx_redirect = response.headers.get("HX-Redirect", "未设置")
        print(f"  HX-Redirect: {hx_redirect}")
        
        if response.status_code == 200:
            print(f"  OK 登录成功")
            print(f"  OK HX-Redirect = {hx_redirect}")
            return hx_redirect
        else:
            print(f"  FAIL 登录失败: {response.text[:200]}")
            return None

async def main():
    member_redirect = await test_login("member", "member123", "会员")
    admin_redirect = await test_login("admin", "admin123", "管理员")
    operator_redirect = await test_login("operator", "operator123", "品牌运营")
    
    print("\n" + "="*50)
    print("验证结果:")
    print(f"  会员跳转 /mall: {'PASS' if member_redirect == '/mall' else 'FAIL'}")
    print(f"  管理员跳转 /admin/dashboard: {'PASS' if admin_redirect == '/admin/dashboard' else 'FAIL'}")
    print(f"  品牌运营跳转 /admin/dashboard: {'PASS' if operator_redirect == '/admin/dashboard' else 'FAIL'}")
    print("="*50)
    
    all_pass = (
        member_redirect == '/mall' and 
        admin_redirect == '/admin/dashboard' and 
        operator_redirect == '/admin/dashboard'
    )
    print("Overall:", "ALL PASS" if all_pass else "SOME FAILED")

if __name__ == "__main__":
    asyncio.run(main())
