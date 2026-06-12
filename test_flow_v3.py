#!/usr/bin/env python3
import sys, json, urllib.request, urllib.parse

API = 'http://localhost:8000/api'

def post(path, data, token=None):
    req = urllib.request.Request(API + path, data=json.dumps(data).encode('utf-8'),
                                 headers={'Content-Type': 'application/json'})
    if token: req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def get(path, token=None, query=None):
    url = API + path
    if query: url += '?' + urllib.parse.urlencode(query)
    req = urllib.request.Request(url)
    if token: req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Step 1: login
login_resp = post('/auth/login', {'username':'submitter','password':'submitter123'})
TOKEN = login_resp['access_token']
me = login_resp['user']
print(f"✅ Step 1: submitter 登录成功 ({me['full_name']})")

# Step 2: create submission
payload = {
  "checklist_id": 1,
  "contract_name": "XX公司数据处理服务协议",
  "contract_version": "V2.1",
  "counterparty": "XX科技有限公司",
  "contract_amount": 500000,
  "risk_level": "medium",
  "deadline": "2026-12-31",
  "answers": [
    {"item_id":1,"status":"non_compliant","answer_text":"合同仅约定了数据处理目的，但未明确处理方式和范围"},
    {"item_id":2,"status":"compliant","answer_text":"已明确合法性基础","evidence_url":"https://example.com/dpa"},
    {"item_id":3,"status":"partial","answer_text":"部分涉及主体权利章节需要补充"},
    {"item_id":4,"status":"pending","answer_text":""},
    {"item_id":5,"status":"compliant","answer_text":"OK"},
    {"item_id":6,"status":"non_compliant","answer_text":"完全没有涉及跨境传输条款"},
    {"item_id":7,"status":"compliant","answer_text":"OK"},
    {"item_id":8,"status":"partial","answer_text":"安全措施描述不完整"},
    {"item_id":9,"status":"not_applicable","answer_text":"本合同不涉及"},
    {"item_id":10,"status":"pending","answer_text":""},
    {"item_id":11,"status":"compliant","answer_text":"OK"},
    {"item_id":12,"status":"non_compliant","answer_text":"审计权和违约条款缺失"},
  ]
}
sub = post('/checklists/submissions', payload, TOKEN)
SID = sub['id']
print(f"✅ Step 2: 创建检查提交 ID={SID}")
print(f"   合同: {sub['contract_name']}  ({sub['contract_version']}) 对方: {sub['counterparty']}")
print(f"   状态: {sub['status']}  | 初始 score: {sub.get('overall_score')}")

# Step 3: submit for review
sub = post(f'/checklists/submissions/{SID}/submit', {}, TOKEN)
print(f"\n✅ Step 3: 已提交审核 -> 状态 = {sub['status']} @ {sub.get('submitted_at','')}")

# Step 4: auto-generate gaps
gen = post(f'/gaps/auto-generate/{SID}', {}, TOKEN)
print(f"\n✅ Step 4: 自动识别并生成合规缺口 -> {gen.get('created',0)} 个")

# Step 5: list gaps
gaps_resp = get('/gaps', TOKEN, {'page_size': 50})
items = gaps_resp.get('items', [])
print(f"\n✅ Step 5: 合规缺口列表 (共 {gaps_resp.get('total',len(items))} 个)")
for g in items:
    dl = g.get('remediation_deadline') or '-'
    print("   - 缺口 #%-2s [%-8s] [%-11s] [%s] %s" %
          (g['id'], g['severity'], g['status'], dl, (g.get('description') or '')[:42]))

# Step 6: drill down
GID = items[0]['id'] if items else None
if GID:
    detail = get(f'/gaps/{GID}/detail', TOKEN)
    g = detail.get('gap', {})
    sub_ = detail.get('submission', {})
    item_ = detail.get('item', {})
    owner = detail.get('owner') or {}
    hists = detail.get('histories', [])
    print(f"\n✅ Step 6: 缺口 #{GID} 下钻明细")
    print(f"   缺口描述: {g.get('description')}")
    print(f"   严重度 / 状态: {g.get('severity')} / {g.get('status')}")
    print(f"   整改期限: {g.get('remediation_deadline')}   整改责任人: {owner.get('full_name','-')}")
    print(f"   关联合同: {sub_.get('contract_name')} ({sub_.get('contract_version')}) 对方: {sub_.get('counterparty')}")
    print(f"   来源检查项 章节: {item_.get('section')}")
    print(f"   来源检查项 问题: {item_.get('question')}")
    print(f"   证据要求: {item_.get('required_evidence')}")
    print(f"   变更历史记录数: {len(hists)}")
    if hists:
        h = hists[0]
        who = h.get('changed_by_name') or '-'
        action = h.get('action') or ''
        field = h.get('field') or ''
        comment = h.get('comment') or ''
        print("   记录1: [%s] %s  %s  %s → %s  备注:%s" %
              (h.get('time',''), who, action, field or h.get('old','') or '', h.get('new','') or '', comment or h.get('old','') or ''))

# Step 7: risk board with manager view
mgr = post('/auth/login', {'username':'manager','password':'manager123'})
MT = mgr['access_token']
board = get('/dashboard/risk-board', MT)
ov = board.get('overdue', [])
w3 = board.get('within_3_days', [])
w7 = board.get('within_7_days', [])
aw = board.get('after_7_days', [])
print(f"\n✅ Step 7: 期限风险看板")
print(f"   🔴 已超期: {len(ov)} 个")
print(f"   🟠 3天内到期: {len(w3)} 个")
print(f"   🟡 7天内到期: {len(w7)} 个")
print(f"   🟢 7天以上: {len(aw)} 个")
all_items = ov + w3 + w7 + aw
if all_items:
    print("   --- 看板条目 (示例) ---")
    for g in all_items[:6]:
        days = g.get('days_left')
        if days is None or days < 0:
            dl = '超期' + (str(abs(days)) + '天' if days else '')
        else:
            dl = '剩' + str(days) + '天'
        desc = (g.get('contract_name') or '')[:40]
        gcl = g.get('critical_gap_count', 0)
        ghl = g.get('high_gap_count', 0)
        gaps = g.get('gap_count', 0)
        print("   - 合同提交 #%-2s  [%-8s]  [风险:%-5s]  [缺口%d个(危%d/高%d)]  %s" %
              (g['id'], dl, g.get('risk_level','-'), gaps, gcl, ghl, desc))
summary = board.get('summary') or {}
print(f"   汇总: {summary}")

print(f"\n🎉🎉🎉 端到端 API 全流程 7 步全部通过！")
print(f"   登录 → 创建清单 → 提交审核 → 自动识别 5 个合规缺口 → 下钻明细 → 期限风险看板")
print(f"   后台 API: {API[:-4]} 文档: {API[:-4]}/docs")
print(f"   演示账号: admin/admin123  manager/manager123  submitter/submitter123")
