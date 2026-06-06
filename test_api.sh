#!/bin/bash

echo "========================================"
echo "  招聘流程效率仪表盘 - 完整链路测试"
echo "========================================"

API_BASE="http://localhost:5000"
passed=0
failed=0

test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local body=$4

    echo ""
    echo "🧪 测试: $name"
    echo "   $method $API_BASE$endpoint"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$body" \
            "$API_BASE$endpoint")
    fi

    body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)

    if echo "$status_code" | grep -q "^2"; then
        echo "   ✅ 状态码: $status_code"
        echo "   响应预览: $(echo "$body" | python -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2)[:300])" 2>/dev/null || echo "$body" | cut -c 1-300)"
        passed=$((passed + 1))
    else
        echo "   ❌ 状态码: $status_code"
        echo "   错误: $body"
        failed=$((failed + 1))
    fi
}

echo ""
echo "📋 测试清单:"
echo "   1. /api/health  - 健康检查"
echo "   2. /api/dimensions - 获取维度选项"
echo "   3. /api/funnel - 招聘漏斗（按部门筛选）"
echo "   4. /api/stage-duration - 阶段耗时"
echo "   5. /api/channel-quality - 渠道质量"
echo "   6. /api/interviewer-workload - 面试官负载"
echo "   7. /api/feedback - 候选人体验"
echo "   8. /api/summary - 摘要统计"
echo "   9. /api/candidates - 候选人明细"
echo "  10. /api/data-quality - 数据质量检查"

echo ""
echo "🚀 开始测试..."
echo "===================="

test_api "健康检查" "GET" "/api/health" ""
test_api "获取维度" "GET" "/api/dimensions" ""
test_api "招聘漏斗（技术部）" "POST" "/api/funnel" '{"departments":["技术部"]}'
test_api "招聘漏斗（按渠道分组）" "POST" "/api/funnel" '{"group_by":"channel"}'
test_api "阶段耗时" "POST" "/api/stage-duration" '{}'
test_api "阶段耗时（按部门分组）" "POST" "/api/stage-duration" '{"group_by":"department"}'
test_api "渠道质量" "POST" "/api/channel-quality" '{}'
test_api "面试官负载" "POST" "/api/interviewer-workload" '{}'
test_api "候选人体验" "POST" "/api/feedback" '{}'
test_api "摘要统计" "POST" "/api/summary" '{}'
test_api "候选人明细" "POST" "/api/candidates" '{"stages":["一面"]}'
test_api "数据质量" "GET" "/api/data-quality" ""

echo ""
echo "===================="
echo "📊 测试结果:"
echo "   ✅ 通过: $passed"
echo "   ❌ 失败: $failed"
echo "   📈 总计: $((passed + failed))"

if [ "$failed" -eq 0 ]; then
    echo ""
    echo "🎉 所有测试通过！API 服务运行正常。"
else
    echo ""
    echo "⚠️  部分测试失败，请检查服务状态和配置。"
fi
