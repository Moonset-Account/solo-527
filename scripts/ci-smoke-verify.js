#!/usr/bin/env node
/**
 * CI Smoke Test 验证脚本
 * 检查机器可读 JSON 报告中：
 * 1. cart.itemsCount 基准 ICU plural 正确提取 count (非空数组)
 * 2. search.noResults 仍正确识别 query vs keyword 差异
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

// 1. cart.itemsCount (de) ICU 占位符差异检查
const icuMismatch = report.placeholderMismatches.find(
  (p) => p.key === "cart.itemsCount" && p.locale === "de"
);
check(
  "[ICU] 检测到 cart.itemsCount (de) 占位符不匹配",
  !!icuMismatch,
  icuMismatch
    ? `base=${JSON.stringify(icuMismatch.basePlaceholders)} vs de=${JSON.stringify(icuMismatch.targetPlaceholders)}`
    : undefined
);
if (icuMismatch) {
  check(
    "[ICU] 基准 en 的 ICU plural 提取为 count",
    Array.isArray(icuMismatch.basePlaceholders) &&
      icuMismatch.basePlaceholders.length === 1 &&
      icuMismatch.basePlaceholders[0] === "count",
    `实际 basePlaceholders=${JSON.stringify(icuMismatch.basePlaceholders)}`
  );
  check(
    "[ICU] 目标 de 的 ICU plural 提取为 numItems",
    Array.isArray(icuMismatch.targetPlaceholders) &&
      icuMismatch.targetPlaceholders.length === 1 &&
      icuMismatch.targetPlaceholders[0] === "numItems",
    `实际 targetPlaceholders=${JSON.stringify(icuMismatch.targetPlaceholders)}`
  );
}

// 2. search.noResults (zh-CN) 占位符差异检查
const queryMismatch = report.placeholderMismatches.find(
  (p) => p.key === "search.noResults" && p.locale === "zh-CN"
);
check(
  "[Query] 检测到 search.noResults (zh-CN) 占位符不匹配",
  !!queryMismatch
);
if (queryMismatch) {
  check(
    "[Query] 基准 query vs 目标 keyword 正确",
    queryMismatch.basePlaceholders?.[0] === "query" &&
      queryMismatch.targetPlaceholders?.[0] === "keyword",
    `base=${JSON.stringify(queryMismatch.basePlaceholders)} target=${JSON.stringify(queryMismatch.targetPlaceholders)}`
  );
}

// 3. 报告完整性检查
check(
  "[Report] 元数据字段齐全",
  typeof report.generatedAt === "string" &&
    typeof report.version === "string" &&
    report.baseLocale &&
    Array.isArray(report.targetLocales) &&
    report.summary
);

console.log("");
if (failed === 0) {
  console.log("🎉 CI 占位符与报告验证全部通过");
  process.exit(0);
} else {
  console.error(`💥 ${failed} 项检查失败`);
  process.exit(1);
}
