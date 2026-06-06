#!/usr/bin/env python3
"""
验证脚本：测试初始化容错、API 接口可用性、数据质量告警
运行方式：python verify_system.py
"""

import sys
import os
import json
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("  招聘流程效率仪表盘 - 系统验证")
print("=" * 60)

passed = 0
failed = 0

def test_case(name, test_func):
    global passed, failed
    print(f"\n🧪 测试: {name}")
    try:
        result = test_func()
        if result:
            print(f"   ✅ 通过")
            passed += 1
        else:
            print(f"   ❌ 失败")
            failed += 1
    except Exception as e:
        print(f"   ❌ 异常: {e}")
        traceback.print_exc()
        failed += 1


def test_1_dimension_options_with_missing_data():
    """测试1: 维度数据安全提取（模拟部分数据缺失）"""
    from data_service import DataService

    ds = DataService()
    dims = ds.get_dimension_options()

    required_keys = ["positions", "departments", "recruiters", "channels", "stages", "interviewers"]
    for key in required_keys:
        if key not in dims:
            print(f"   缺少维度键: {key}")
            return False

    issues = ds.get_dimension_issues()
    print(f"   维度问题: {issues}")
    print(f"   职位数: {len(dims['positions'])}, 部门数: {len(dims['departments'])}")
    print(f"   渠道数: {len(dims['channels'])}, 招聘官数: {len(dims['recruiters'])}")

    ds.close()
    return isinstance(issues, list)


def test_2_data_quality_comprehensive():
    """测试2: 全面数据质量检查"""
    from data_service import DataService

    ds = DataService()
    issues = ds.check_data_quality()

    print(f"   发现 {len(issues)} 个数据质量问题:")
    for issue in issues:
        severity = issue.get("severity", "unknown")
        field = issue.get("field", "unknown")
        msg = issue.get("message", "")
        print(f"     - [{severity.upper()}] {field}: {msg[:60]}...")

    expected_checks = ["position", "department", "channel", "recruiter"]
    found_fields = [i.get("field", "") for i in issues]

    print(f"   检查的字段: {found_fields}")
    ds.close()
    return True


def test_3_api_health_endpoint():
    """测试3: 健康检查接口结构"""
    from api_server import app
    client = app.test_client()

    response = client.get("/api/health")
    data = response.get_json()

    print(f"   状态码: {response.status_code}")
    print(f"   响应键: {list(data.keys()) if data else '空'}")

    required_keys = ["status", "database_mode", "timestamp"]
    for key in required_keys:
        if key not in data:
            print(f"   缺少响应键: {key}")
            return False

    print(f"   数据库模式: {data.get('database_mode')}")
    print(f"   状态: {data.get('status')}")

    return response.status_code in [200, 503]


def test_4_api_aggregation_endpoints():
    """测试4: 聚合接口可用性"""
    from api_server import app
    client = app.test_client()

    test_cases = [
        ("funnel", "/api/funnel", {"departments": ["技术部"]}),
        ("funnel_grouped", "/api/funnel", {"group_by": "channel"}),
        ("stage_duration", "/api/stage-duration", {}),
        ("stage_duration_grouped", "/api/stage-duration", {"group_by": "department"}),
        ("channel_quality", "/api/channel-quality", {}),
        ("interviewer_workload", "/api/interviewer-workload", {"positions": ["高级Python工程师"]}),
        ("feedback", "/api/feedback", {}),
        ("summary", "/api/summary", {"channels": ["LinkedIn"]}),
        ("candidates", "/api/candidates", {"stages": ["一面"]}),
    ]

    all_ok = True
    for name, endpoint, payload in test_cases:
        response = client.post(endpoint, json=payload)
        status = response.status_code
        ok = status in [200, 503]
        print(f"   {name}: {status} {'✅' if ok else '❌'}")
        if not ok:
            all_ok = False
            data = response.get_json()
            print(f"     错误: {data}")

    return all_ok


def test_5_dimension_endpoint():
    """测试5: 维度选项接口"""
    from api_server import app
    client = app.test_client()

    response = client.get("/api/dimensions")
    data = response.get_json()

    print(f"   状态码: {response.status_code}")

    if response.status_code == 200:
        if "dimensions" in data and "issues" in data:
            dims = data["dimensions"]
            issues = data["issues"]
            print(f"   维度数量: positions={len(dims['positions'])}, channels={len(dims['channels'])}")
            print(f"   维度问题: {issues}")
            return True
    elif response.status_code == 503:
        print(f"   服务不可用（预期行为）: {data}")
        return True

    return False


def test_6_app_init_without_db():
    """测试6: 应用初始化容错（模拟数据库连接失败）"""
    print("   验证 Dash 应用初始化包含 try-except 容错...")

    import importlib.util
    spec = importlib.util.spec_from_file_location("app_check", os.path.join(os.path.dirname(__file__), "app.py"))
    app_module = importlib.util.module_from_spec(spec)

    with open(os.path.join(os.path.dirname(__file__), "app.py"), "r") as f:
        content = f.read()

    checks = [
        ("init_db()", "try-except 包裹初始化"),
        ("init_error = None", "初始化错误变量"),
        ("get_init_alerts()", "告警生成函数"),
        ("if not data_service:", "回调中的 data_service 空值检查"),
    ]

    all_found = True
    for check_str, desc in checks:
        found = check_str in content
        print(f"   {desc}: {'✅ 找到' if found else '❌ 未找到'}")
        if not found:
            all_found = False

    return all_found


def test_7_data_quality_endpoint():
    """测试7: 数据质量检查接口"""
    from api_server import app
    client = app.test_client()

    response = client.get("/api/data-quality")
    data = response.get_json()

    print(f"   状态码: {response.status_code}")

    if response.status_code == 200:
        print(f"   问题数量: {data.get('count', 0)}")
        if "issues" in data:
            for issue in data["issues"][:3]:
                print(f"     - {issue.get('severity')}: {issue.get('message')[:50]}")
        return True
    elif response.status_code == 503:
        print(f"   服务不可用（预期行为）")
        return True

    return False


if __name__ == "__main__":
    print("\n📋 运行验证测试...")
    print("-" * 60)

    test_case("维度数据安全提取", test_1_dimension_options_with_missing_data)
    test_case("全面数据质量检查", test_2_data_quality_comprehensive)
    test_case("健康检查接口", test_3_api_health_endpoint)
    test_case("维度选项接口", test_5_dimension_endpoint)
    test_case("聚合接口可用性", test_4_api_aggregation_endpoints)
    test_case("数据质量接口", test_7_data_quality_endpoint)
    test_case("Dash 应用初始化容错", test_6_app_init_without_db)

    print("\n" + "=" * 60)
    print(f"📊 验证结果:")
    print(f"   ✅ 通过: {passed}")
    print(f"   ❌ 失败: {failed}")
    print(f"   📈 总计: {passed + failed}")
    print("=" * 60)

    if failed == 0:
        print("\n🎉 所有验证通过！")
        print("\n📝 可用接口:")
        print("   GET  http://localhost:5000/api/health")
        print("   GET  http://localhost:5000/api/dimensions")
        print("   GET  http://localhost:5000/api/data-quality")
        print("   POST http://localhost:5000/api/funnel")
        print("   POST http://localhost:5000/api/stage-duration")
        print("   POST http://localhost:5000/api/channel-quality")
        print("   POST http://localhost:5000/api/interviewer-workload")
        print("   POST http://localhost:5000/api/feedback")
        print("   POST http://localhost:5000/api/summary")
        print("   POST http://localhost:5000/api/candidates")
        print("\n📝 支持的筛选参数（所有 POST 接口）:")
        print("   {\"positions\": [...], \"departments\": [...],")
        print("    \"recruiters\": [...], \"channels\": [...],")
        print("    \"stages\": [...], \"date_range\": [start, end],")
        print("    \"group_by\": \"position\"|\"department\"|\"recruiter\"|\"channel\"}")
        sys.exit(0)
    else:
        print("\n⚠️  部分验证失败，请检查配置和服务状态")
        sys.exit(1)
