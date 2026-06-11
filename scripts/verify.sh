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

_json_check() {
  local json_str=$1
  local condition=$2
  echo "$json_str" | node -e "
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
    const ok = !!(${condition});
    process.exit(ok ? 0 : 1);
  " 2>/dev/null
}

_json_extract() {
  local json_str=$1
  local expr=$2
  echo "$json_str" | node -e "
    const fs = require('fs');
    const d = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
    try {
      const val = (${expr});
      if (val === undefined) { process.stdout.write('undefined'); process.exit(0); }
      if (val === null)      { process.stdout.write('null');      process.exit(0); }
      if (typeof val === 'object') { process.stdout.write(JSON.stringify(val)); process.exit(0); }
      process.stdout.write(String(val));
    } catch (e) {
      process.stdout.write('<error>');
      process.exit(2);
    }
  " 2>/dev/null
}

assert_json_field() {
  local json_str=$1
  local condition=$2
  local test_name=$3

  if _json_check "$json_str" "$condition"; then
    echo "✅ $test_name"
    PASS=$((PASS + 1))
  else
    echo "❌ $test_name"
    echo "   条件: ${condition}"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_field_eq() {
  local json_str=$1
  local expr=$2
  local expected_js=$3
  local test_name=$4

  if _json_check "$json_str" "(${expr}) === (${expected_js})"; then
    local actual
    actual=$(_json_extract "$json_str" "$expr")
    echo "✅ $test_name (${actual})"
    PASS=$((PASS + 1))
  else
    local actual
    actual=$(_json_extract "$json_str" "$expr")
    echo "❌ $test_name"
    echo "   表达式: ${expr} === ${expected_js}"
    echo "   实际值: ${actual}"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_has_fields() {
  local json_str=$1
  local scope_expr=$2
  shift 2
  local fields=("$@")

  for field in "${fields[@]}"; do
    if _json_check "$json_str" "(${scope_expr}).${field} !== undefined"; then
      echo "✅ 字段 ${scope_expr}.${field} 存在"
      PASS=$((PASS + 1))
    else
      echo "❌ 字段 ${scope_expr}.${field} 缺失"
      FAIL=$((FAIL + 1))
    fi
  done
}

echo "📝 测试 1: 解析示例笔记（表格格式）"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "解析成功"
assert_contains "$OUTPUT" "任务列表" "包含标题"
assert_contains "$OUTPUT" "待处理" "包含待处理任务"
assert_contains "$OUTPUT" "已完成" "包含已完成任务"
echo ""

echo "📝 测试 2: JSON 格式输出"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --format json)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "JSON 输出成功"
assert_json_valid "$OUTPUT" "JSON 格式有效"
assert_json_field "$OUTPUT" "Array.isArray(d) && d.length > 0" "数组非空"
assert_json_has_fields "$OUTPUT" "d[0]" "title" "status" "priority" "tags" "project" "sourceFile" "sourceLine"
echo ""

echo "📝 测试 3: 按标签筛选"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --tag work --format json)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "标签筛选成功"
TASK_COUNT=$(_json_extract "$OUTPUT" "d.length")
echo "   找到 $TASK_COUNT 个带 work 标签的任务"
if [ "$TASK_COUNT" -gt 0 ] 2>/dev/null; then
  echo "✅ 标签筛选返回结果"
  PASS=$((PASS + 1))
else
  echo "❌ 标签筛选未返回结果"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "📝 测试 4: 按截止日期筛选 (today)"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --due today --format json)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "日期筛选执行成功"
echo ""

echo "📝 测试 5: 按状态筛选 (pending)"
echo "----------------------------------------"
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --status pending --format json)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "状态筛选成功"
PENDING_COUNT=$(_json_extract "$OUTPUT" "d.filter(t => t.status === 'pending').length")
TOTAL_COUNT=$(_json_extract "$OUTPUT" "d.length")
if [ "$PENDING_COUNT" -eq "$TOTAL_COUNT" ] 2>/dev/null && [ "$TOTAL_COUNT" -gt 0 ] 2>/dev/null; then
  echo "✅ 仅返回待处理任务 ($TOTAL_COUNT 个)"
  PASS=$((PASS + 1))
else
  echo "❌ 状态筛选结果不正确 (pending=$PENDING_COUNT, total=$TOTAL_COUNT)"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "📝 测试 6: 无输入文件 (退出码 4)"
echo "----------------------------------------"
EXIT_CODE=0
OUTPUT=$(npx tsx src/index.ts parse --format json) || EXIT_CODE=$?
assert_exit_code 4 $EXIT_CODE "无输入文件返回退出码 4"
assert_json_valid "$OUTPUT" "报告 JSON 格式有效"
assert_json_field_eq "$OUTPUT" "d.exitCode" "4" "报告中 exitCode 为 4"
assert_json_field_eq "$OUTPUT" "d.success" "false" "报告中 success 为 false"
echo ""

echo "📝 测试 7: 机器可读报告"
echo "----------------------------------------"
REPORT_FILE="/tmp/note2task-report-test.json"
rm -f "$REPORT_FILE"
npx tsx src/index.ts report examples/*.md --report "$REPORT_FILE" > /dev/null
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "报告命令执行成功"
if [ -f "$REPORT_FILE" ]; then
  echo "✅ 报告文件已创建"
  PASS=$((PASS + 1))
  REPORT_CONTENT=$(cat "$REPORT_FILE")
  assert_json_valid "$REPORT_CONTENT" "报告 JSON 格式有效"
  assert_json_has_fields "$REPORT_CONTENT" "d" "version" "exitCode" "success" "errors" "summary" "performance"
  assert_json_field_eq "$REPORT_CONTENT" "d.exitCode" "0" "报告中 exitCode 为 0"
  assert_json_field_eq "$REPORT_CONTENT" "d.success" "true" "报告中 success 为 true"
  assert_json_field "$REPORT_CONTENT" "d.summary.total > 0" "summary.total > 0"
  assert_json_field "$REPORT_CONTENT" "d.summary.processed > 0" "summary.processed > 0"
  assert_json_field "$REPORT_CONTENT" "typeof d.performance.durationMs === 'number'" "performance.durationMs 存在"
else
  echo "❌ 报告文件未创建"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "📝 测试 8: 导出功能"
echo "----------------------------------------"
EXPORT_FILE="/tmp/note2task-export-test.json"
rm -f "$EXPORT_FILE"
npx tsx src/index.ts parse examples/*.md --export "$EXPORT_FILE" > /dev/null
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "导出命令执行成功"
if [ -f "$EXPORT_FILE" ]; then
  echo "✅ 导出文件已创建"
  PASS=$((PASS + 1))
  EXPORT_CONTENT=$(cat "$EXPORT_FILE")
  assert_json_valid "$EXPORT_CONTENT" "导出 JSON 格式有效"
  EXPORT_COUNT=$(_json_extract "$EXPORT_CONTENT" "d.length")
  echo "   导出了 $EXPORT_COUNT 条任务"
else
  echo "❌ 导出文件未创建"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "📝 测试 9: 同步预览"
echo "----------------------------------------"
EXPORT_FILE="/tmp/note2task-existing.json"
echo '[{"id":"test1","title":"旧任务","status":"pending","priority":"medium","tags":[],"sourceFile":"test.md","sourceLine":1,"rawContent":"- [ ] 旧任务"}]' > "$EXPORT_FILE"
OUTPUT=$(npx tsx src/index.ts preview examples/*.md --export "$EXPORT_FILE" --format json)
EXIT_CODE=$?
assert_exit_code 0 $EXIT_CODE "预览命令执行成功"
assert_json_valid "$OUTPUT" "预览 JSON 格式有效"
assert_json_has_fields "$OUTPUT" "d" "added" "updated" "removed" "unchanged"
PREVIEW_ADDED=$(_json_extract "$OUTPUT" "d.added.length")
PREVIEW_REMOVED=$(_json_extract "$OUTPUT" "d.removed.length")
echo "   新增: $PREVIEW_ADDED, 删除: $PREVIEW_REMOVED"
rm -f "$EXPORT_FILE"
echo ""

echo "📝 测试 10: 无效日期参数错误处理"
echo "----------------------------------------"
EXIT_CODE=0
OUTPUT=$(npx tsx src/index.ts parse examples/*.md --due invalid-date --format json) || EXIT_CODE=$?
echo "   退出码: $EXIT_CODE"
if [ "$EXIT_CODE" -ne 0 ]; then
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
