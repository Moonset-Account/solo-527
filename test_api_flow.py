#!/usr/bin/env python3
"""全链路接口验证脚本"""

import requests
import json
import sys

BASE = 'http://localhost:8001'

def print_section(title):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")

def main():
    session = requests.Session()

    # 1. 登录
    print_section("1. 登录测试")
    r = session.post(f'{BASE}/api/auth/login', json={'username': 'farmer', 'password': 'farmer123'})
    print(f"[POST] /api/auth/login -> {r.status_code}")
    if not r.ok:
        print(f"  ❌ 登录失败: {r.text}")
        sys.exit(1)
    
    data = r.json()
    token = data['access_token']
    print(f"  ✅ 登录成功, token: {token[:30]}...")
    session.headers.update({'Authorization': f'Bearer {token}'})

    # 2. 健康检查
    print_section("2. 健康检查")
    r = session.get(f'{BASE}/api/health')
    print(f"[GET] /api/health -> {r.status_code}: {r.json()}")

    # 3. 地块列表
    print_section("3. 地块列表")
    r = session.get(f'{BASE}/api/harvest/plots?page_size=10')
    print(f"[GET] /api/harvest/plots -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 个地块")
        for p in data['data'][:2]:
            print(f"     - {p['code']}: {p['name']} ({p['area_mu']}亩)")
    else:
        print(f"  ❌ 错误: {r.text[:200]}")

    # 4. 品种列表 - 关键验证
    print_section("4. 品种列表 (plant_date 类型修复验证)")
    r = session.get(f'{BASE}/api/harvest/varieties?page_size=10&plot_id=1')
    print(f"[GET] /api/harvest/varieties?plot_id=1 -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 个品种")
        for v in data['data'][:3]:
            plant_date = v.get('plant_date')
            print(f"     - {v['code']}: {v['name']}, plant_date={plant_date}, type={type(plant_date).__name__}")
    else:
        print(f"  ❌ 错误: {r.text[:500]}")

    # 5. 采收列表
    print_section("5. 采收列表")
    r = session.get(f'{BASE}/api/harvest/harvests?page_size=10')
    print(f"[GET] /api/harvest/harvests -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 条采收记录")
        if data['data']:
            h = data['data'][0]
            print(f"     - {h['code']}: {h['harvest_date']}, 实际={h['actual_yield_kg']}kg, 预测={h['predicted_yield_kg']}kg")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    # 6. 创建采收记录
    print_section("6. 创建采收记录 (验证表单提交)")
    new_harvest = {
        'code': 'H-TEST-API-001',
        'plot_id': 1,
        'variety_id': 1,
        'harvest_date': '2025-06-15',
        'status': 'in_progress',
        'weather': '晴',
        'temperature_c': 35.0,
        'humidity_pct': 90.0,
        'workers_count': 12,
        'actual_yield_kg': 3500.0,
        'quality_score': 87.0,
        'notes': 'API测试采收记录-高温高湿',
        'run_auto_chain': True
    }
    r = session.post(f'{BASE}/api/harvest/harvests', json=new_harvest)
    print(f"[POST] /api/harvest/harvests -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 创建成功: id={data['id']}, code={data['code']}")
        print(f"     预测产量: {data['predicted_yield_kg']}kg, 偏差: {data['yield_deviation_pct']}%")
        harvest_id = data['id']
    else:
        print(f"  ❌ 错误: {r.text[:500]}")
        harvest_id = None

    # 7. 告警列表
    print_section("7. 阈值告警列表")
    r = session.get(f'{BASE}/api/monitor/alerts?page_size=10')
    print(f"[GET] /api/monitor/alerts -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 条告警")
        for a in data['data'][:3]:
            print(f"     - [{a['level']}] {a['metric']}={a['actual_value']}: {a['message'][:40]}...")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    # 8. 产量预测列表
    print_section("8. 产量预测列表")
    r = session.get(f'{BASE}/api/monitor/predictions?page_size=10')
    print(f"[GET] /api/monitor/predictions -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 条预测")
        for p in data['data'][:3]:
            print(f"     - 采收#{p['harvest_id']}: {p['predicted_yield_kg']}kg, 置信度={p['confidence_pct']}%")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    # 9. 补贴凭证列表
    print_section("9. 补贴凭证列表")
    r = session.get(f'{BASE}/api/subsidy/vouchers?page_size=10')
    print(f"[GET] /api/subsidy/vouchers -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 条补贴凭证")
        for s in data['data'][:3]:
            print(f"     - {s['code']}: ¥{s['amount']}, 状态={s['status']}")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    # 10. 分选差异列表
    print_section("10. 分选差异列表")
    r = session.get(f'{BASE}/api/sorting/differences?page_size=10')
    print(f"[GET] /api/sorting/differences -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 条分选差异")
        for s in data['data'][:3]:
            print(f"     - 批次#{s['batch_id']}: 差异{s['diff_weight_kg']:+.2f}kg, 结果={s['result']}")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    # 11. 报表统计
    print_section("11. Dashboard 报表统计")
    r = session.get(f'{BASE}/api/reports/summary')
    print(f"[GET] /api/reports/summary -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 统计数据:")
        for k, v in data.items():
            print(f"     - {k}: {v}")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    # 12. 分选统计
    print_section("12. 分选统计")
    r = session.get(f'{BASE}/api/sorting/stats')
    print(f"[GET] /api/sorting/stats -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 分选统计:")
        for k, v in data.items():
            print(f"     - {k}: {v}")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    # 13. 通知列表
    print_section("13. 通知列表")
    r = session.get(f'{BASE}/api/reports/notifications?page_size=10')
    print(f"[GET] /api/reports/notifications -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 条通知")
        for n in data['data'][:3]:
            print(f"     - [{n['notification_type']}] {n['title'][:30]}...")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    # 14. 批次列表
    print_section("14. 采收批次列表")
    r = session.get(f'{BASE}/api/harvest/batches?page_size=10')
    print(f"[GET] /api/harvest/batches -> {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  ✅ 共 {len(data['data'])} 个批次")
        for b in data['data'][:3]:
            print(f"     - {b['code']}: {b['weight_kg']}kg, 状态={b['status']}")
    else:
        print(f"  ❌ 错误: {r.text[:300]}")

    print(f"\n{'=' * 60}")
    print("  🎉 全链路接口验证完成")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    main()
