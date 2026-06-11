#!/usr/bin/env bash
#
# git-brclean CI 示例
# 在 CI 流水线中定期清理已合并的分支
#
# 退出码说明:
#   0 - 成功 (可能有删除或没有可删除的)
#   1 - 发生错误
#
# 在 CI 中使用时建议配合 --dry-run 先试运行，确认无误后再执行真实删除

set -euo pipefail

echo "=== Git 分支清理 (CI 模式) ==="

# 检查 git-brclean 是否可用
if ! command -v git-brclean &> /dev/null; then
    echo "错误: 未找到 git-brclean 命令，请先安装"
    exit 1
fi

REPO_PATH="${1:-.}"
DRY_RUN="${DRY_RUN:-true}"
OLDER_THAN_DAYS="${OLDER_THAN_DAYS:-30}"
MIN_RISK="${MIN_RISK:-safe}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-json}"
REPORT_FILE="${REPORT_FILE:-branch-cleanup-report.json}"

echo "仓库路径: ${REPO_PATH}"
echo "试运行模式: ${DRY_RUN}"
echo "最小保留天数: ${OLDER_THAN_DAYS} 天"
echo "最低风险等级: ${MIN_RISK}"
echo "输出格式: ${OUTPUT_FORMAT}"
echo ""

# 第一步：扫描并生成报告
echo "步骤 1/2: 扫描分支..."
git-brclean scan \
    --repo "${REPO_PATH}" \
    --older-than "${OLDER_THAN_DAYS}" \
    --format json-pretty \
    --output "${REPORT_FILE}"

SCAN_EXIT=$?
echo "扫描完成，退出码: ${SCAN_EXIT}"

# 显示摘要
if [ -f "${REPORT_FILE}" ]; then
    echo ""
    echo "=== 扫描摘要 ==="
    if command -v jq &> /dev/null; then
        jq '.summary' "${REPORT_FILE}"
    else
        grep -A 20 '"summary"' "${REPORT_FILE}" | head -25
    fi
fi

# 第二步：如果不是试运行，执行清理
if [ "${DRY_RUN}" != "true" ]; then
    echo ""
    echo "步骤 2/2: 执行清理..."
    git-brclean clean \
        --repo "${REPO_PATH}" \
        --older-than "${OLDER_THAN_DAYS}" \
        --min-risk "${MIN_RISK}" \
        --merged \
        --no-interactive \
        --format "${OUTPUT_FORMAT}" \
        --output cleanup-result.json

    CLEAN_EXIT=$?
    echo "清理完成，退出码: ${CLEAN_EXIT}"
    exit ${CLEAN_EXIT}
else
    echo ""
    echo "试运行模式 - 未执行实际删除"
    echo "设置 DRY_RUN=false 以执行真实清理"
    exit ${SCAN_EXIT}
fi
