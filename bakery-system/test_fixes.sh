#!/bin/bash
API="http://127.0.0.1:8080/api"
TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email":"admin@bakery.com","password":"password123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH="Authorization: Bearer $TOKEN"
JSON="Content-Type: application/json"

echo "=== 🧪 测试1: 创建订单 ==="
ORDER=$(curl -s -X POST $API/orders -H "$JSON" -d '{"pickup_slot_id":1,"customer_name":"测试用户","customer_phone":"13900139001","items":[{"product_id":1,"quantity":1}]}')
ORDER_ID=$(echo $ORDER | python3 -c "import sys,json; print(json.load(sys.stdin)['order']['id'])")
echo "订单ID: $ORDER_ID"

echo -e "\n=== 🧪 测试2: 确认订单 ==="
curl -s -X POST $API/orders/$ORDER_ID/confirm -H "$AUTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✓ 状态:', d['order']['status'])"

echo -e "\n=== 🧪 测试3: 收定金(正确) ==="
curl -s -X POST $API/payments -H "$AUTH" -H "$JSON" -d "{\"order_id\":$ORDER_ID,\"type\":\"deposit\",\"amount\":50,\"method\":\"wechat\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✓ 结果:', d.get('message', '成功'))"

echo -e "\n=== 🧪 测试4: 重复收定金(应报错) ==="
curl -s -X POST $API/payments -H "$AUTH" -H "$JSON" -d "{\"order_id\":$ORDER_ID,\"type\":\"deposit\",\"amount\":50,\"method\":\"wechat\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✗ 预期报错，结果:', d.get('message', d))"

echo -e "\n=== 🧪 测试5: 收全款金额错误(应报错) ==="
curl -s -X POST $API/payments -H "$AUTH" -H "$JSON" -d "{\"order_id\":$ORDER_ID,\"type\":\"full\",\"amount\":100,\"method\":\"wechat\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✗ 预期报错，结果:', d.get('message', d))"

echo -e "\n=== 🧪 测试6: 收尾款(正确) ==="
curl -s -X POST $API/payments -H "$AUTH" -H "$JSON" -d "{\"order_id\":$ORDER_ID,\"type\":\"balance\",\"amount\":78,\"method\":\"wechat\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✓ 结果:', d.get('message', '成功'), '支付状态:', d.get('payment', {}).get('order', {}).get('payment_status'))"

echo -e "\n=== 🧪 测试7: 超收测试(应报错) ==="
curl -s -X POST $API/payments -H "$AUTH" -H "$JSON" -d "{\"order_id\":$ORDER_ID,\"type\":\"full\",\"amount\":10,\"method\":\"wechat\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✗ 预期报错，结果:', d.get('message', d))"

echo -e "\n=== 🧪 测试8: 查看时段1当前订单数 ==="
curl -s -X GET $API/pickup-slots/1 -H "$AUTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✓ current_orders:', d['current_orders'])"

echo -e "\n=== 🧪 测试9: 创建订单2测试退款 ==="
ORDER2=$(curl -s -X POST $API/orders -H "$JSON" -d '{"pickup_slot_id":1,"customer_name":"退款测试","customer_phone":"13900139002","items":[{"product_id":2,"quantity":1}]}')
ORDER2_ID=$(echo $ORDER2 | python3 -c "import sys,json; print(json.load(sys.stdin)['order']['id'])")
echo "订单2 ID: $ORDER2_ID"

curl -s -X POST $API/orders/$ORDER2_ID/confirm -H "$AUTH" > /dev/null
curl -s -X POST $API/payments -H "$AUTH" -H "$JSON" -d "{\"order_id\":$ORDER2_ID,\"type\":\"full\",\"amount\":168,\"method\":\"alipay\"}" > /dev/null
echo "✓ 订单2确认并收全款完成"

echo -e "\n=== 🧪 测试10: 部分退款(时段不应扣减) ==="
curl -s -X GET $API/pickup-slots/1 -H "$AUTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print('退款前 current_orders:', d['current_orders'])"
curl -s -X POST $API/refunds -H "$AUTH" -H "$JSON" -d "{\"order_id\":$ORDER2_ID,\"type\":\"partial\",\"amount\":50,\"method\":\"alipay\",\"reason\":\"部分退款测试\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✓ 退款结果:', d.get('message', '成功'))"
curl -s -X GET $API/pickup-slots/1 -H "$AUTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print('部分退款后 current_orders:', d['current_orders'], '(应该不变)')"

echo -e "\n=== 🧪 测试11: 全额退款(时段应扣减) ==="
curl -s -X POST $API/refunds -H "$AUTH" -H "$JSON" -d "{\"order_id\":$ORDER2_ID,\"type\":\"full\",\"amount\":118,\"method\":\"alipay\",\"reason\":\"全额退款测试\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✓ 退款结果:', d.get('message', '成功'))"
curl -s -X GET $API/pickup-slots/1 -H "$AUTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print('全额退款后 current_orders:', d['current_orders'], '(应该减1)')"

echo -e "\n=== 🧪 测试12: 订单状态检查 ==="
curl -s -X GET $API/orders/$ORDER2_ID -H "$AUTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print('订单状态:', d['status'], '支付状态:', d['payment_status'])"

echo -e "\n=== ✅ 所有测试完成 ==="
