#!/bin/bash
set -e

BASE="http://localhost:8088/api"

ADMIN_TOKEN=$(curl -s -X POST $BASE/token/ -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"test123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access'])")
PROJECT_TOKEN=$(curl -s -X POST $BASE/token/ -H "Content-Type: application/json" -d '{"email":"project@example.com","password":"test123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access'])")
PROC_TOKEN=$(curl -s -X POST $BASE/token/ -H "Content-Type: application/json" -d '{"email":"procurement@example.com","password":"test123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access'])")
DUTY_TOKEN=$(curl -s -X POST $BASE/token/ -H "Content-Type: application/json" -d '{"email":"duty@example.com","password":"test123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access'])")

echo "=== 1. 项目负责人发起续签 ==="
RESULT=$(curl -s -X POST $BASE/contracts/4/create_renewal/ \
  -H "Authorization: Bearer $PROJECT_TOKEN" -H "Content-Type: application/json" \
  -d '{"renewal_recommendation":"供应商表现良好，建议续签"}')
echo $RESULT | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  续签ID: {d.get(\"id\", \"N/A\")}')
print(f'  状态: {d.get(\"decision_display\", d.get(\"error\", \"N/A\"))}')
"

echo ""
echo "=== 2. 获取续签记录ID ==="
RENEWAL_ID=$(curl -s "$BASE/contracts/renewals/?original_contract=4&decision=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['results'][0]['id'] if r['results'] else 0)")
echo "  续签记录ID: $RENEWAL_ID"

echo ""
echo "=== 3. 创建新合同（续签目标） ==="
NEW_CONTRACT_JSON=$(curl -s -X POST $BASE/contracts/ \
  -H "Authorization: Bearer $PROC_TOKEN" -H "Content-Type: application/json" \
  -d '{"contract_number":"HT-2027-E2E-RENEW02","title":"2027年度E2E续签合同","supplier":1,"project_manager":3,"start_date":"2027-01-01","end_date":"2027-12-31","total_amount":250000,"payment_terms":"monthly","status":"active","categories":[1,3],"specifications":[1,3],"price_lines":[{"specification":1,"unit_price":"28.00","minimum_quantity":50,"discount_rate":5,"effective_date":"2027-01-01"},{"specification":3,"unit_price":"540.00","minimum_quantity":5,"discount_rate":10,"effective_date":"2027-01-01"}]}')
NEW_CONTRACT_ID=$(echo $NEW_CONTRACT_JSON | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "  新合同ID: $NEW_CONTRACT_ID"

echo ""
echo "=== 4. 值班人员处理续签（应403） ==="
curl -s -o /dev/null -w "  HTTP状态: %{http_code}\n" -X POST $BASE/contracts/renewals/$RENEWAL_ID/handle/ \
  -H "Authorization: Bearer $DUTY_TOKEN" -H "Content-Type: application/json" \
  -d "{\"decision\":\"renewed\",\"new_contract\":$NEW_CONTRACT_ID,\"decision_reason\":\"测试拦截\"}"

echo ""
echo "=== 5. 项目负责人处理续签 ==="
RESULT=$(curl -s -X POST $BASE/contracts/renewals/$RENEWAL_ID/handle/ \
  -H "Authorization: Bearer $PROJECT_TOKEN" -H "Content-Type: application/json" \
  -d "{\"decision\":\"renewed\",\"new_contract\":$NEW_CONTRACT_ID,\"decision_reason\":\"价格合理，同意续签\"}")
echo $RESULT | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  决策结果: {d.get(\"decision_display\", \"N/A\")}')
print(f'  新合同: {d.get(\"new_contract\", \"N/A\")}')
"

echo ""
echo "=== 6. 原合同状态 ==="
curl -s $BASE/contracts/4/ -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  状态: {d[\"status_display\"]}')
"

echo ""
echo "=== 7. 新合同价格历史（续签标记） ==="
curl -s "$BASE/contracts/price-histories/?contract=$NEW_CONTRACT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for h in d['results']:
    print(f'  {h[\"specification_name\"]}: ¥{h[\"unit_price\"]} - {h[\"change_reason\"]}')
"

echo ""
echo "=== 8. 价格波动看板（规格1 A4复印纸） ==="
curl -s "$BASE/contracts/price-histories/fluctuation/?specification=1&months=24" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data:
    print(f'  {d[\"month\"]}: 均价¥{d[\"avg_price\"]:.2f}, 最低¥{d[\"min_price\"]:.2f}, 最高¥{d[\"max_price\"]:.2f}')
"

echo ""
echo "=== 续签测试完成 ==="
