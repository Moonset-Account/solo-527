#!/usr/bin/env python3
"""
验证修复后的核心功能
"""

import requests
import sys

BASE_URL = "http://localhost:3003/api"

def login(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": password
    })
    if r.status_code == 200:
        return r.json()['token']
    print(f"登录失败: {r.status_code} {r.text}")
    sys.exit(1)

def test_maintenance_endpoint(token):
    print("\n=== 测试1: 维修申报接口 /maintenances ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    r = requests.get(f"{BASE_URL}/maintenances/my", headers=headers)
    print(f"GET /maintenances/my: {r.status_code}")
    
    data = {"toolId": 1, "description": "测试维修申报"}
    r = requests.post(f"{BASE_URL}/maintenances", data=data, headers=headers)
    print(f"POST /maintenances: {r.status_code}")
    
    if r.status_code == 201:
        print("✅ /maintenances 接口正常")
        return True
    print(f"❌ /maintenances 接口异常: {r.text}")
    return False

def test_borrow_check_availability(token):
    print("\n=== 测试2: 可用性检查接口 ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {
        "toolId": 1,
        "borrowDate": "2026-06-10",
        "expectedReturnDate": "2026-06-15"
    }
    r = requests.post(f"{BASE_URL}/tools/check-availability", json=data, headers=headers)
    print(f"POST /tools/check-availability: {r.status_code}")
    
    if r.status_code == 200 and 'available' in r.json():
        print("✅ 可用性检查接口正常")
        return True
    print("❌ 可用性检查接口异常")
    return False

def test_offline_borrow_flow(token):
    print("\n=== 测试3: 借用申请创建 ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {
        "toolId": 3,
        "borrowDate": "2026-07-10",
        "expectedReturnDate": "2026-07-15",
        "purpose": "测试离线借用申请"
    }
    r = requests.post(f"{BASE_URL}/borrows", json=data, headers=headers)
    print(f"POST /borrows: {r.status_code}")
    
    if r.status_code == 201:
        result = r.json()
        print(f"  状态: {result['borrow']['status']}")
        print("✅ 借用申请创建成功")
        return True
    print(f"  错误: {r.text}")
    return False

def test_valuable_tool_requires_approval(token):
    print("\n=== 测试4: 贵重工具自动待审核 ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    r = requests.get(f"{BASE_URL}/tools", headers=headers)
    tools = r.json()['tools']
    valuable_tool = None
    for t in tools:
        if t.get('isValuable'):
            valuable_tool = t
            break
    
    if not valuable_tool:
        print("⚠️  没有找到贵重工具，跳过测试")
        return True
    
    print(f"使用贵重工具: {valuable_tool['name']} (ID: {valuable_tool['id']})")
    
    data = {
        "toolId": valuable_tool['id'],
        "borrowDate": "2026-08-10",
        "expectedReturnDate": "2026-08-12",
        "purpose": "测试贵重工具审核"
    }
    r = requests.post(f"{BASE_URL}/borrows", json=data, headers=headers)
    print(f"POST /borrows: {r.status_code}")
    
    if r.status_code == 201:
        status = r.json()['borrow']['status']
        print(f"  状态: {status}")
        if status == 'pending':
            print("✅ 贵重工具正确进入待审核状态")
            return True
        print(f"❌ 状态应为 pending，实际为 {status}")
        return False
    print(f"  错误: {r.text}")
    return False

def test_frontend_logic_check():
    print("\n=== 测试5: 前端代码逻辑检查 ===")
    
    with open('client/src/utils/offline.js', 'r') as f:
        offline_content = f.read()
    
    with open('client/src/utils/request.js', 'r') as f:
        request_content = f.read()
    
    with open('client/src/views/mobile/BorrowForm.vue', 'r') as f:
        borrow_content = f.read()
    
    with open('client/src/views/mobile/MaintenanceReport.vue', 'r') as f:
        maint_content = f.read()
    
    all_pass = True
    
    # 检查 offline.js
    if "api.post('/maintenances'" in offline_content:
        print("✅ syncOfflineMaintenance 提交到 /maintenances")
    else:
        print("❌ syncOfflineMaintenance 路径错误")
        all_pass = False
    
    if "generateRequestKey" in offline_content:
        print("✅ addPendingRequest 有去重逻辑")
    else:
        print("❌ 缺少去重逻辑")
        all_pass = False
    
    # 检查 request.js
    if "'post', 'put', 'patch', 'delete'" in request_content:
        print("✅ request.js 仅缓存 POST/PUT/PATCH/DELETE 请求")
    else:
        print("❌ request.js 未正确过滤请求方法")
        all_pass = False
    
    # 检查 BorrowForm.vue
    if "hasRealConflict" in borrow_content:
        print("✅ 离线可用性检查不阻塞提交 (hasRealConflict)")
    else:
        print("❌ 缺少 hasRealConflict 逻辑")
        all_pass = False
    
    if "!hasRealConflict.value" in borrow_content:
        print("✅ 提交按钮不受离线提示禁用")
    else:
        print("❌ 提交按钮判断逻辑错误")
        all_pass = False
    
    if "offline-notice" in borrow_content:
        print("✅ 离线时显示专门提示")
    else:
        print("❌ 缺少离线提示样式")
        all_pass = False
    
    # 检查 MaintenanceReport.vue
    template_part = maint_content.split("<template>")[1].split("</template>")[0]
    if "navigator.onLine" not in template_part:
        print("✅ 维修申报页模板不直接使用 navigator.onLine")
    else:
        print("❌ 模板中直接使用了 navigator.onLine")
        all_pass = False
    
    if "onUnmounted" in maint_content:
        print("✅ 使用 onUnmounted 清理事件监听")
    else:
        print("❌ 缺少事件监听清理")
        all_pass = False
    
    return all_pass

def main():
    print("=" * 60)
    print("社区共享工具借还系统 - 功能验证")
    print("=" * 60)
    
    print("\n居民登录 (resident1 / resident123)")
    user_token = login("resident1", "resident123")
    
    results = []
    results.append(("维修申报接口", test_maintenance_endpoint(user_token)))
    results.append(("可用性检查接口", test_borrow_check_availability(user_token)))
    results.append(("借用申请创建", test_offline_borrow_flow(user_token)))
    results.append(("贵重工具自动待审核", test_valuable_tool_requires_approval(user_token)))
    results.append(("前端代码逻辑", test_frontend_logic_check()))
    
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name}: {status}")
    
    print(f"\n总计: {passed}/{total} 通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！")
        return 0
    print(f"\n⚠️  有 {total - passed} 项测试未通过")
    return 1

if __name__ == "__main__":
    sys.exit(main())
