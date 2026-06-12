#!/bin/bash
set -e
API=http://localhost:8000/api

# 1. Login
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"submitter","password":"submitter123"}' | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("access_token",""))')
echo "✅ Step 1: submitter logged in"

# 2. Create submission with answers
PAYLOAD=$(cat <<'JSON'
{
  "template_id": 1,
  "contract_name": "XX公司数据处理服务协议",
  "contract_version": "V2.1",
  "counterparty": "XX科技有限公司",
  "contract_amount": 500000,
  "risk_level": "medium",
  "contract_deadline": "2026-12-31",
  "contract_owner": "赵磊",
  "department": "业务发展部",
  "notes": "首次合规审查",
  "answers": [
    {"item_id":1,"status":"non_compliant","content":"合同仅约定了数据处理目的，但未明确处理方式和范围"},
    {"item_id":2,"status":"compliant","content":"已明确合法性基础","evidence_url":"https://example.com/dpa"},
    {"item_id":3,"status":"partial","content":"部分涉及主体权利章节需要补充"},
    {"item_id":4,"status":"pending","content":""},
    {"item_id":5,"status":"compliant","content":"OK"},
    {"item_id":6,"status":"non_compliant","content":"完全没有涉及跨境传输条款"},
    {"item_id":7,"status":"compliant","content":"OK"},
    {"item_id":8,"status":"partial","content":"安全措施描述不完整"},
    {"item_id":9,"status":"not_applicable","content":"本合同不涉及"},
    {"item_id":10,"status":"pending","content":""},
    {"item_id":11,"status":"compliant","content":"OK"},
    {"item_id":12,"status":"non_compliant","content":"审计权和违约条款缺失"}
  ]
}
JSON
)

SUBMISSION=$(curl -s -X POST $API/checklists/submissions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$PAYLOAD")
SID=$(echo "$SUBMISSION" | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("id","ERR"))')
echo "✅ Step 2: Submission created, ID=$SID"
echo "$SUBMISSION" | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); print("   合规得分:", d.get("compliance_score"), "| 状态:", d.get("status"))'

# 3. List gaps
echo ""
echo "✅ Step 3: 自动生成的合规缺口列表"
GAPS=$(curl -s "$API/gaps" -H "Authorization: Bearer $TOKEN")
echo "$GAPS" | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); print("   总数:", d.get("total")); [print(f"   #{g[\"id\"]} {g[\"severity\"]:<6} {g[\"status\"]:<12} {g[\"description\"][:38]}") for g in d.get("items", [])]'

# 4. Drill down gap detail
GID=$(echo "$GAPS" | /usr/bin/python3 -c 'import sys,json; d=json.load(sys.stdin); items=d.get("items",[]); print(items[0]["id"] if items else "none")')
if [ "$GID" != "none" ]; then
  echo ""
  echo "✅ Step 4: 缺口 #$GID 下钻明细"
  DETAIL=$(curl -s "$API/gaps/$GID/detail" -H "Authorization: Bearer $TOKEN")
  echo "$DETAIL" | /usr/bin/python3 -c '
import sys, json
d = json.load(sys.stdin)
g = d.get("gap", {})
sub = d.get("submission", {})
item = d.get("item", {})
owner = d.get("owner", {})
hists = d.get("histories", [])
print(f"   缺口: {g.get(\"description\")}")
print(f"   严重度/状态: {g.get(\"severity\")} / {g.get(\"status\")}")
print(f"   整改期限: {g.get(\"rectification_deadline\")}  责任人: {owner.get(\"full_name\", \"-\")}")
print(f"   合同: {sub.get(\"contract_name\")} ({sub.get(\"contract_version\")}) 对方: {sub.get(\"counterparty\")}")
print(f"   检查项章节: {item.get(\"section\")}")
print(f"   检查项问题: {item.get(\"question\")}")
print(f"   证据要求: {item.get(\"required_evidence\")}")
print(f"   变更历史记录: {len(hists)} 条")
if hists:
  h = hists[0]
  print(f"   首条记录: [{h.get(\"changed_at\",\"\")}] {h.get(\"changed_by_name\",\"-\")} {h.get(\"change_type\",\"\")} {h.get(\"old_value\",\"\")} → {h.get(\"new_value\",\"\")} 备注: {h.get(\"remark\",\"\")}")
'
fi

# 5. Risk board
echo ""
echo "✅ Step 5: 期限风险看板"
BOARD=$(curl -s "$API/dashboard/risk-board" -H "Authorization: Bearer $TOKEN")
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
  print("   --- 看板条目 ---")
  for g in all_items[:5]:
    days = g.get("days_left")
    dl = "超期" if days is None or days < 0 else f"{days}天"
    print(f"   #{g[\"id\"]} [{dl}] {g[\"severity\"]:<5} {g[\"status\"]:<10} {g[\"description\"][:35]}")
print(f"   汇总: {d.get(\"summary\")}")
'

echo ""
echo "🎉 端到端 API 全部验证通过！"
