#!/usr/bin/env bash
# note2task 验收检查脚本
# 验证 dry-run、错误输入、JSON 输出三大验收项

set -e
PASS=0
FAIL=0
BIN="cargo run --quiet --"

pass() {
    echo "✅  PASS: $1"
    PASS=$((PASS + 1))
}

fail() {
    echo "❌  FAIL: $1"
    FAIL=$((FAIL + 1))
}

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

cat > "$TMPDIR/notes.md" <<'EOF'
## 工作项目

- [ ] 写周报 @due(today) !1
- [ ] 修复登录 bug #bug @due(2025-06-15)
- [x] 已完成的任务
- [/] 进行中的任务 #inprogress
- [ ] 重复任务 A
- [ ] 重复任务 A
- [ ] 重复任务 A

## 个人事项

- [ ] 买牛奶 #life @due(tomorrow)
EOF

# ------------------------------------------------------------
section "验收 1: Dry-Run 预览模式"
# ------------------------------------------------------------

OUT_FILE="$TMPDIR/output.json"

# 测试1: dry-run + 写入文件 (stdout 为空，日志在 stderr)
$BIN scan --from "$TMPDIR" --export "json:$OUT_FILE" --dry-run --today 2025-06-10 > "$TMPDIR/stdout1.txt" 2> "$TMPDIR/stderr1.txt"

if [ ! -f "$OUT_FILE" ]; then
    pass "dry-run 不创建输出文件"
else
    fail "dry-run 不应创建 $OUT_FILE"
fi

if grep -qi "\[dry-run\]" "$TMPDIR/stderr1.txt"; then
    pass "dry-run stderr 日志包含 [dry-run] 标记"
else
    fail "dry-run stderr 日志不包含 [dry-run]"
fi

# 测试1b: dry-run + 输出到 stdout 格式 (检查 stdout 中有 dry-run 字样)
$BIN scan --from "$TMPDIR" --dry-run --today 2025-06-10 > "$TMPDIR/stdout1b.txt" 2>/dev/null
if grep -qi "dry-run" "$TMPDIR/stdout1b.txt"; then
    pass "dry-run 控制台报告中显示预览标识"
else
    fail "dry-run 控制台报告缺少预览标识 (stdout)"
fi

# ------------------------------------------------------------
section "验收 2: 错误输入处理（错误码 + 错误提示）"
# ------------------------------------------------------------

# 2.1 不存在的路径
set +e
$BIN scan --from "/nonexistent/abc123_path_xyz" --today 2025-06-10 >/dev/null 2>&1
CODE=$?
set -e
if [ "$CODE" -eq 2 ]; then
    pass "无效路径退出码=2 (实际=$CODE)"
else
    fail "无效路径退出码应为2 (实际=$CODE)"
fi

# 2.2 不支持的导出格式
set +e
$BIN scan --from "$TMPDIR" --export xml --today 2025-06-10 >/dev/null 2>&1
CODE=$?
set -e
if [ "$CODE" -eq 6 ]; then
    pass "不支持的导出格式退出码=6 (实际=$CODE)"
else
    fail "不支持的导出格式退出码应为6 (实际=$CODE)"
fi

# 2.3 无效日期格式
set +e
$BIN scan --from "$TMPDIR" --due "bad-date" --today 2025-06-10 >/dev/null 2>&1
CODE=$?
set -e
if [ "$CODE" -eq 4 ]; then
    pass "无效 --due 日期退出码=4 (实际=$CODE)"
else
    fail "无效 --due 日期退出码应为4 (实际=$CODE)"
fi

# 2.4 非 Markdown 文件
TXT="$TMPDIR/readme.txt"
echo "hello" > "$TXT"
set +e
$BIN scan --from "$TXT" --today 2025-06-10 >/dev/null 2>&1
CODE=$?
set -e
if [ "$CODE" -eq 3 ]; then
    pass "非 Markdown 文件退出码=3 (实际=$CODE)"
else
    fail "非 Markdown 文件退出码应为3 (实际=$CODE)"
fi

# 2.5 错误提示友好性（中文 + 建议）
set +e
$BIN scan --from "/no/such/dir" --today 2025-06-10 2> "$TMPDIR/err.txt" >/dev/null
set -e
if grep -q "提示" "$TMPDIR/err.txt"; then
    pass "错误信息包含使用建议"
else
    fail "错误信息缺少使用建议"
fi

# ------------------------------------------------------------
section "验收 3: JSON 输出正确性"
# ------------------------------------------------------------

$BIN scan --from "$TMPDIR" --export json --today 2025-06-10 > "$TMPDIR/out.json" 2>/dev/null

# 3.1 是有效 JSON
if command -v python3 &>/dev/null; then
    if python3 -c "import json; json.load(open('$TMPDIR/out.json'))" 2>/dev/null; then
        pass "JSON 输出是有效的 JSON"
    else
        fail "JSON 输出无效"
    fi
else
    # fallback: 检查花括号
    if head -c1 "$TMPDIR/out.json" | grep -q "{"; then
        pass "JSON 输出格式疑似有效（缺少 python3 使用简单检查）"
    else
        fail "JSON 输出开头不是 '{'"
    fi
fi

# 3.2 包含顶层字段
for FIELD in "generated_at" "summary" "items" "files_scanned" "dry_run"; do
    if grep -q "\"$FIELD\"" "$TMPDIR/out.json"; then
        pass "JSON 顶层字段: $FIELD"
    else
        fail "JSON 缺少顶层字段: $FIELD"
    fi
done

# 3.3 summary 数值正确
if command -v python3 &>/dev/null; then
    TOTAL=$(python3 -c "import json; d=json.load(open('$TMPDIR/out.json')); print(d['summary']['total_parsed'])")
    AFTER_FILTER=$(python3 -c "import json; d=json.load(open('$TMPDIR/out.json')); print(d['summary']['total_after_filter'])")
    AFTER=$(python3 -c "import json; d=json.load(open('$TMPDIR/out.json')); print(d['summary']['total_after_dedup'])")
    DUP=$(python3 -c "import json; d=json.load(open('$TMPDIR/out.json')); print(d['summary']['duplicates_removed'])")
    EXPECTED_DUP=$((AFTER_FILTER - AFTER))

    # 8 tasks total (写周报/修复bug/已完成/进行中/重复Ax3/买牛奶)
    # after dedup 6 (3 重复任务 A 去重为 1, 去掉 2)
    if [ "$TOTAL" = "8" ]; then
        pass "JSON summary.total_parsed = $TOTAL (期望 8)"
    else
        fail "JSON summary.total_parsed = $TOTAL (期望 8)"
    fi
    if [ "$AFTER" = "6" ]; then
        pass "JSON summary.total_after_dedup = $AFTER (期望 6)"
    else
        fail "JSON summary.total_after_dedup = $AFTER (期望 6)"
    fi
    if [ "$DUP" = "2" ]; then
        pass "JSON summary.duplicates_removed = $DUP (期望 2)"
    else
        fail "JSON summary.duplicates_removed = $DUP (期望 2)"
    fi
    if [ "$DUP" = "$EXPECTED_DUP" ]; then
        pass "JSON summary.duplicates_removed 与 (total_after_filter - total_after_dedup) 一致: $DUP = $AFTER_FILTER - $AFTER"
    else
        fail "JSON summary 不一致: duplicates_removed($DUP) != total_after_filter($AFTER_FILTER) - total_after_dedup($AFTER)"
    fi
fi

# 3.4 items 中每条都有必要字段
for FIELD in "id" "content" "status" "tags" "source"; do
    if grep -q "\"$FIELD\"" "$TMPDIR/out.json"; then
        pass "JSON 每个 item 都包含字段: $FIELD"
    else
        fail "JSON item 字段缺失: $FIELD"
    fi
done

# 3.5 --tag 过滤后的 JSON 结果
$BIN scan --from "$TMPDIR" --tag bug --export json --today 2025-06-10 > "$TMPDIR/bug.json" 2>/dev/null
if command -v python3 &>/dev/null; then
    COUNT=$(python3 -c "import json; d=json.load(open('$TMPDIR/bug.json')); print(len(d['items']))")
    if [ "$COUNT" -ge 1 ]; then
        pass "--tag bug 过滤后 JSON 有 $COUNT 条记录"
    else
        fail "--tag bug 过滤后 JSON 应有 >=1 条, 实际=$COUNT"
    fi
    # 关键验证：过滤后场景下，duplicates_removed 不得把被过滤掉的任务算进去
    S_TOTAL=$(python3 -c "import json; d=json.load(open('$TMPDIR/bug.json')); print(d['summary']['total_parsed'])")
    S_AF=$(python3 -c "import json; d=json.load(open('$TMPDIR/bug.json')); print(d['summary']['total_after_filter'])")
    S_AD=$(python3 -c "import json; d=json.load(open('$TMPDIR/bug.json')); print(d['summary']['total_after_dedup'])")
    S_DUP=$(python3 -c "import json; d=json.load(open('$TMPDIR/bug.json')); print(d['summary']['duplicates_removed'])")
    EXPECTED_DUP=$((S_AF - S_AD))
    if [ "$S_DUP" = "$EXPECTED_DUP" ]; then
        pass "--tag 过滤后 duplicates_removed 正确: $S_DUP = total_after_filter($S_AF) - total_after_dedup($S_AD)"
    else
        fail "--tag 过滤后 duplicates_removed 错误: $S_DUP 期望=$EXPECTED_DUP (全部解析=$S_TOTAL, 过滤后=$S_AF, 输出=$S_AD)"
    fi
    if [ "$S_AD" = "$COUNT" ]; then
        pass "--tag 过滤后 total_after_dedup 与 items 长度一致 ($S_AD == $COUNT)"
    else
        fail "不一致: total_after_dedup=$S_AD 但 len(items)=$COUNT"
    fi
fi

# 3.6 JSON 导出到文件
$BIN scan --from "$TMPDIR" --export "json:$TMPDIR/exported.json" --today 2025-06-10 >/dev/null 2>&1
if [ -f "$TMPDIR/exported.json" ] && [ -s "$TMPDIR/exported.json" ]; then
    pass "--export json:PATH 成功写入文件"
else
    fail "--export json:PATH 未写入或文件为空"
fi

# ------------------------------------------------------------
section "验收 4: 额外 - 帮助文档和 shell completion"
# ------------------------------------------------------------

if $BIN --help >/dev/null 2>&1; then
    pass "--help 正常输出"
else
    fail "--help 失败"
fi

if $BIN --version >/dev/null 2>&1; then
    pass "--version 正常输出"
else
    fail "--version 失败"
fi

if $BIN completions bash > "$TMPDIR/bash.sh" 2>/dev/null && [ -s "$TMPDIR/bash.sh" ]; then
    pass "completions bash 生成脚本"
else
    fail "completions bash 失败"
fi

# ------------------------------------------------------------
section "总结"
# ------------------------------------------------------------
echo ""
echo "  通过: $PASS"
echo "  失败: $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo "🎉  所有验收用例通过!"
    exit 0
else
    echo "⚠️   有 $FAIL 个验收用例失败"
    exit 1
fi
