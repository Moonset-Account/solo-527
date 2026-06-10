#!/usr/bin/env node
/**
 * CI Smoke Test 验证脚本
 * 检查机器可读 JSON 报告中：
 * 1. cart.itemsCount：基准 en 和所有目标 locale 均使用 count，placeholderMismatches 不包含该键
 * 2. search.noResults：仍正确识别 zh-CN 的 query vs keyword 真实占位符不匹配
 * 3. 示例数据存在其他差异（至少 1 个缺失键），确保 CLI 会按 failOn 策略返回非零退出码
 * 4. 报告元数据完整
 */

const report = require(process.argv[2] || "/tmp/report.json");

let failed = 0;

function check(name, cond, detail) {
  if (cond) {
    console.log(`✅ ${name}${detail ? ": " + detail : ""}`);
  } else {
    console.error(`❌ ${name}`);
    failed++;
  }
}

// 1. cart.itemsCount 占位符一致性检查
const anyCartMismatch = report.placeholderMismatches.some(
  (p) => p.key === "cart.itemsCount"
);
const placeholderTotal = report.placeholderMismatches.length;
check(
  "[ICU] cart.itemsCount 不在 placeholderMismatches 中（所有 locale 均识别 count，且一致）",
  !anyCartMismatch,
  anyCartMismatch
    ? `错误：检测到 ${report.placeholderMismatches.filter(p => p.key === "cart.itemsCount").length} 条不匹配`
    : `placeholderMismatches 总计 ${placeholderTotal} 条，不含 cart.itemsCount`
);

// 2. search.noResults (zh-CN) 占位符差异检查 — 验证占位符检查本身仍在工作
const queryMismatch = report.placeholderMismatches.find(
  (p) => p.key === "search.noResults" && p.locale === "zh-CN"
);
check(
  "[Query] 检测到 search.noResults (zh-CN) 占位符不匹配",
  !!queryMismatch,
  `placeholderMismatches 总数 = ${placeholderTotal}`
);
if (queryMismatch) {
  check(
    "[Query] 基准 query vs 目标 keyword 正确",
    queryMismatch.basePlaceholders?.[0] === "query" &&
      queryMismatch.targetPlaceholders?.[0] === "keyword",
    `base=${JSON.stringify(queryMismatch.basePlaceholders)} target=${JSON.stringify(queryMismatch.targetPlaceholders)}`
  );
}

// 3. 验证其他类别差异仍存在（示例数据故意包含差异，确保 CLI exit=1 场景被覆盖）
const missingTotal = report.missingKeys.length;
check(
  "[Diff] 至少存在 1 个缺失键（确保示例仍有差异，exit code 非零）",
  missingTotal >= 1,
  `missingKeys = ${missingTotal}`
);

// 4. 报告完整性检查
check(
  "[Report] 元数据字段齐全",
  typeof report.generatedAt === "string" &&
    typeof report.version === "string" &&
    report.baseLocale &&
    Array.isArray(report.targetLocales) &&
    report.summary &&
    typeof report.summary.totalBaseKeys === "number" &&
    typeof report.summary.totalTargetKeys === "object"
);

console.log("");
if (failed === 0) {
  console.log("🎉 CI 占位符与报告验证全部通过");
  process.exit(0);
} else {
  console.error(`💥 ${failed} 项检查失败`);
  process.exit(1);
}

