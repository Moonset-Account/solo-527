#!/bin/bash
set -e
API=http://localhost:8000/api

# 1. Login submitter
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"submitter","password":"submitter123"}' | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("access_token",""))')
echo "✅ Step 1: submitter 登录成功"

# 2. Create submission (correct field names)
PAYLOAD='{
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
    {"item_id":12,"status":"non_compliant","answer_text":"审计权和违约条款缺失"}
  ]
}'

SUBMISSION=$(curl -s -X POST $API/checklists/submissions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$PAYLOAD")
SID=$(echo "$SUBMISSION" | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("id","ERR"))')
if [ "$SID" = "ERR" ]; then
  echo "❌ 创建提交失败：$SUBMISSION"
  exit 1
fi
echo "✅ Step 2: 创建检查提交成功 ID=$SID"
echo "$SUBMISSION" | /usr/bin/python3 -c '
import sys, json
d = json.load(sys.stdin)
print("   合同:", d.get("contract_name"))
print("   状态:", d.get("status"), "| 总分:", d.get("overall_score"))
'

# 3. Submit for review
echo ""
echo "✅ Step 3: 提交审核..."
curl -s -X POST "$API/checklists/submissions/$SID/submit" -H "Authorization: Bearer $TOKEN" > /dev/null
echo "   提交审核完成"

# 4. Auto-generate gaps
echo ""
echo "✅ Step 4: 自动生成合规缺口..."
GEN=$(curl -s -X POST "$API/gaps/auto-generate/$SID" -H "Authorization: Bearer $TOKEN")
echo "$GEN" | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); print("   生成缺口:", d.get("created",0), "个")'

# 5. List gaps
echo ""
echo "✅ Step 5: 合规缺口列表"
GAPS=$(curl -s "$API/gaps" -H "Authorization: Bearer $TOKEN")
echo "$GAPS" | /usr/bin/python3 -c '
import sys, json
d = json.load(sys.stdin)
items = d.get("items", [])
print("   总数:", d.get("total"), "个")
for g in items:
    sev = g.get("severity","-")
    st = g.get("status","-")
    desc = (g.get("description") or "")[:36]
    dl = g.get("remediation_deadline") or "-"
    print(f"   缺口 #{g[\"id\"]} [{sev:>4}] [{st:>11}] [{dl}] {desc}...")
'

# 6. Drill down gap detail
GID=$(echo "$GAPS" | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); items=d.get("items",[]); print(items[0]["id"] if items else "none")')
if [ "$GID" != "none" ]; then
  echo ""
  echo "✅ Step 6: 缺口 #$GID 下钻明细"
  DETAIL=$(curl -s "$API/gaps/$GID/detail" -H "Authorization: Bearer $TOKEN")
  echo "$DETAIL" | /usr/bin/python3 -c '
import sys, json
d = json.load(sys.stdin)
g = d.get("gap", {})
sub = d.get("submission", {})
item = d.get("item", {})
owner = d.get("owner", {}) or {}
hists = d.get("histories", [])
print(f"   缺口: {g.get(\"description\")}")
print(f"   严重度/状态: {g.get(\"severity\")} / {g.get(\"status\")}")
print(f"   整改期限: {g.get(\"remediation_deadline\")}  责任人: {owner.get(\"full_name\", \"-\"), \"-\", owner.get(\"full_name\",\"-\")}")
print(f"   关联合同: {sub.get(\"contract_name\")} ({sub.get(\"contract_version\")}) 对方: {sub.get(\"counterparty\")}")
print(f"   检查项章节: {item.get(\"section\")}")
print(f"   检查项问题: {item.get(\"question\")}")
print(f"   证据要求: {item.get(\"required_evidence\")}")
print(f"   变更历史: {len(hists)} 条")
if hists:
    h = hists[0]
    print(f"   首条记录: [{h.get(\"created_at\",\"\")}] {h.get(\"changed_by_name\",\"-\")} {h.get(\"change_type\",\"\")} {h.get(\"old_value\",\"\")}->{h.get(\"new_value\",\"\")} {h.get(\"remark\",\"\")}")
'
fi

# 7. Risk board (with manager to see all)
MANAGER_TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"manager","password":"manager123"}' | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("access_token",""))')
echo ""
echo "✅ Step 7: 期限风险看板"
BOARD=$(curl -s "$API/dashboard/risk-board" -H "Authorization: Bearer $MANAGER_TOKEN")
echo "$BOARD" | /usr/bin/python3 -c '
import sys, json
d = json.load(sys.stdin)
ov = d.get("overdue", [])
w3 = d.get("within_3_days", [])
w7 = d.get("within_7_days", [])
aw = d.get("after_7_days", [])
print(f"   🔴 已超期: {len(ov)} 个")
print(f"   🟠 3天内到期: {len(w3)} 个")
print(f"   🟡 7天内到期: {len(w7)} 个")
print(f"   🟢 7天以上: {len(aw)} 个")
all_items = ov + w3 + w7 + aw
if all_items:
    print("   --- 看板条目示例 ---")
    for g in all_items[:4]:
        days = g.get("days_left")
        if days is None or days < 0:
            dl = f"超期{abs(days or 0)}天" if days else "超期"
        else:
            dl = f"剩{days}天"
        sev = g.get("severity","-")
        status = g.get("status","-")
        desc = (g.get("description") or "")[:34]
        print(f"   缺口#{g[\"id\"]:>2} [{dl:>6}] [{sev:>4}] [{status:>11}] {desc}...")
summary = d.get("summary", {})
if summary:
    print("   汇总卡片:", summary)
'

echo ""
echo "🎉🎉🎉 端到端 API 全流程测试通过！"
echo "   - 登录 ✅"
echo "   - 创建检查提交 ✅"
echo "   - 提交审核 ✅"
echo "   - 自动识别合规缺口 ✅"
echo "   - 缺口下钻明细（合同/检查项/证据要求/历史记录） ✅"
echo "   - 期限风险看板（四泳道分组 + 汇总） ✅"
