#!/usr/bin/env bash

set -e

echo "========================================"
echo "  note2task - 功能验证脚本"
echo "========================================"
echo ""

PASS=0
FAIL=0

assert_exit_code() {
  local expected=$1
  local actual=$2
  local test_name=$3

  if [ "$actual" -eq "$expected" ]; then
    echo "✅ $test_name (退出码: $actual)"
    PASS=$((PASS + 1))
  else
    echo "❌ $test_name (期望: $expected, 实际: $actual)"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local haystack=$1
  local needle=$2
  local test_name=$3

  if echo "$haystack" | grep -q "$needle"; then
    echo "✅ $test_name"
    PASS=$((PASS + 1))
  else
    echo "❌ $test_name"
    echo "   期望包含: $needle"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_valid() {
  local json_str=$1
  local test_name=$2

  if echo "$json_str" | node -e "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'))" 2>/dev/null; then
    echo "✅ $test_name"
    PASS=$((PASS + 1))
  else
    echo "❌ $test_name"
    FAIL=$((FAIL + 1))
  fi
}

echo "📝 测试 1: 解析示例笔记（表格格式）"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md 2>&1)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "解析成功"
assert_contains "$OUTPUT" "任务列表" "包含标题"
assert_contains "$OUTPUT" "待处理" "包含待处理任务"
assert_contains "$OUTPUT" "已完成" "包含已完成任务"
echo ""

echo "📝 测试 2: JSON 格式输出"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --format json 2>&1)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "JSON 输出成功"
assert_json_valid "$OUTPUT" "JSON 格式有效"
assert_contains "$OUTPUT" '"title"' "包含 title 字段"
assert_contains "$OUTPUT" '"status"' "包含 status 字段"
assert_contains "$OUTPUT" '"tags"' "包含 tags 字段"
echo ""

echo "📝 测试 3: 按标签筛选"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --tag work --format json 2>&1)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "标签筛选成功"
TASK_COUNT=$(echo "$OUTPUT" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
console.log(data.length);
")
echo "   找到 $TASK_COUNT 个带 work 标签的任务"
if [ "$TASK_COUNT" -gt 0 ]; then
  echo "✅ 标签筛选返回结果"
  PASS=$((PASS + 1))
else
  echo "❌ 标签筛选未返回结果"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "📝 测试 4: 按截止日期筛选 (today)"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --due today --format json 2>&1)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "日期筛选执行成功"
echo ""

echo "📝 测试 5: 按状态筛选 (pending)"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --status pending --format json 2>&1)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "状态筛选成功"
PENDING_COUNT=$(echo "$OUTPUT" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
console.log(data.filter(t => t.status === 'pending').length);
")
TOTAL_COUNT=$(echo "$OUTPUT" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
console.log(data.length);
")
if [ "$PENDING_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TOTAL_COUNT" -gt 0 ]; then
  echo "✅ 仅返回待处理任务 ($TASK_COUNT 个)"
  PASS=$((PASS + 1))
else
  echo "❌ 状态筛选结果不正确"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "📝 测试 6: 无输入文件 (退出码 4)"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse --format json 2>&1) || true
EXIT_CODE=$?
assert_exit_code 4 $EXIT_CODE "无输入文件返回退出码 4"
assert_contains "$OUTPUT" '"exitCode":4' "报告中包含退出码 4"
assert_contains "$OUTPUT" '"success":false' "报告中 success 为 false"
echo ""

echo "📝 测试 7: 机器可读报告"
echo "----------------------------------------"
REPORT_FILE="/tmp/note2task-report-test.json"
rm -f "$REPORT_FILE"
npx tsx src/index.ts report examples/*.md --report "$REPORT_FILE" 2>&1 > /dev/null
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "报告命令执行成功"
if [ -f "$REPORT_FILE" ]; then
  echo "✅ 报告文件已创建"
  PASS=$((PASS + 1))
  REPORT_CONTENT=$(cat "$REPORT_FILE")
  assert_json_valid "$REPORT_CONTENT" "报告 JSON 格式有效"
  assert_contains "$REPORT_CONTENT" '"version"' "包含 version 字段"
  assert_contains "$REPORT_CONTENT" '"exitCode"' "包含 exitCode 字段"
  assert_contains "$REPORT_CONTENT" '"success"' "包含 success 字段"
  assert_contains "$REPORT_CONTENT" '"errors"' "包含 errors 字段"
  assert_contains "$REPORT_CONTENT" '"summary"' "包含 summary 字段"
  assert_contains "$REPORT_CONTENT" '"performance"' "包含 performance 字段"
else
  echo "❌ 报告文件未创建"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "📝 测试 8: 导出功能"
echo "----------------------------------------"
EXPORT_FILE="/tmp/note2task-export-test.json"
rm -f "$EXPORT_FILE"
npx tsx src/index.ts parse examples/*.md --export "$EXPORT_FILE" 2>&1 > /dev/null
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "导出命令执行成功"
if [ -f "$EXPORT_FILE" ]; then
  echo "✅ 导出文件已创建"
  PASS=$((PASS + 1))
  EXPORT_CONTENT=$(cat "$EXPORT_FILE")
  assert_json_valid "$EXPORT_CONTENT" "导出 JSON 格式有效"
else
  echo "❌ 导出文件未创建"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "📝 测试 9: 同步预览"
echo "----------------------------------------"
EXPORT_FILE="/tmp/note2task-existing.json"
echo '[{"id":"test1","title":"旧任务","status":"pending","priority":"medium","tags":[],"sourceFile":"test.md","sourceLine":1,"rawContent":"- [ ] 旧任务"}]' > "$EXPORT_FILE"
OUTPUT=$(npx tsx src/index.ts preview examples/*.md --export "$EXPORT_FILE" --format json 2>&1)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "预览命令执行成功"
assert_contains "$OUTPUT" '"added"' "包含 added 字段"
assert_contains "$OUTPUT" '"updated"' "包含 updated 字段"
assert_contains "$OUTPUT" '"removed"' "包含 removed 字段"
assert_contains "$OUTPUT" '"unchanged"' "包含 unchanged 字段"
rm -f "$EXPORT_FILE"
echo ""

echo "📝 测试 10: 无效日期参数错误处理"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --due invalid-date --format json 2>&1) || true
EXIT_CODE=$?
echo "   退出码: $EXIT_CODE"
if [ $EXIT_CODE -ne 0 ]; then
  echo "✅ 无效参数返回非零退出码"
  PASS=$((PASS + 1))
else
  echo "❌ 无效参数应返回非零退出码"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "========================================"
echo "  测试总结"
echo "========================================"
echo "通过: $PASS"
echo "失败: $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "🎉 所有测试通过!"
  exit 0
else
  echo "⚠️  有 $FAIL 个测试失败"
  exit 1
fi
