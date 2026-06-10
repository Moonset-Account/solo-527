import { createTestFixtures } from './helpers/createFixtures';
import { tmpdir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { runAudit } from '../src/engine/auditEngine';
import { createProgress } from '../src/utils/progress';
import { renderConsoleReport } from '../src/output/consoleReporter';
import { generateDeletePlan, buildDeleteActions } from '../src/output/deletePlan';
import type { AuditConfig } from '../src/types';

async function run() {
  const testDir = fs.mkdtempSync(path.join(tmpdir(), 'image-audit-test-'));
  console.log('\n🧪 测试目录:', testDir);

  const fixture = createTestFixtures(testDir);
  console.log('✅ 测试数据创建完成');

  const config: AuditConfig = {
    imageDir: fixture.imageDir,
    manifestPath: path.join(fixture.projectDir, 'manifest.json'),
    include: ['**/*.{png,jpg,jpeg,gif,webp,svg,avif,ico,bmp}'],
    ignore: ['**/node_modules/**', '**/.git/**'],
    sizeRules: {
      default: { maxWidth: 8192, maxHeight: 8192 },
      byPathGlob: {
        '**/icons/**': { maxWidth: 512, maxHeight: 512, allowedRatios: ['1:1'] },
        '**/banners/**': { minWidth: 1200, allowedRatios: ['16:9', '4:3'] },
        '**/avatars/**': { allowedRatios: ['1:1'], minWidth: 200 },
      },
    },
    dynamicRefs: [
      { pattern: 'tsx', glob: path.join(fixture.projectDir, '**/*.{tsx,jsx,ts,js}') },
      { pattern: 'html', glob: path.join(fixture.projectDir, '**/*.{html,vue}') },
      { pattern: 'css', glob: path.join(fixture.projectDir, '**/*.{css,scss,less}') },
    ],
    json: false,
    dryRun: true,
    progress: true,
    candidateThreshold: 0,
  };

  console.log('\n🚀 运行校验引擎...');
  const progress = createProgress(false);
  const report = await runAudit({ config, progress, baseDir: testDir });

  console.log('\n📊 引擎运行完成，结果摘要:');
  console.log('  - 图片总数:', report.summary.totalImages);
  console.log('  - 引用总数:', report.summary.totalReferences);
  console.log('  - 尺寸违规:', report.sizeViolations.length);
  console.log('  - 重复文件组:', report.duplicates.length);
  console.log('  - 缺失 alt:', report.missingAlts.length);
  console.log('  - 未引用候选:', report.unreferencedCandidates.length);
  console.log('  - 软链接警告:', report.symlinkWarnings.length);
  console.log('  - 错误数:', report.errors.length);

  console.log('\n' + '═'.repeat(60));
  console.log(renderConsoleReport(report, testDir, true));

  console.log('\n🗑️  生成删除计划（仅重复文件，不包含未引用）:');
  const planResult = await generateDeletePlan({
    report,
    dryRun: true,
    outputDir: path.join(testDir, 'plans'),
    includeUnreferenced: false,
    unreferencedScoreThreshold: 0.3,
    progress,
    baseDir: testDir,
  });
  console.log('  - 删除计划:', planResult.planPath);
  console.log('  - 撤销脚本:', planResult.undoPath);
  console.log('  - 计划操作数:', planResult.plan.actions.length);
  for (const action of planResult.plan.actions) {
    console.log('    *', action.reason, '→', path.relative(testDir, action.originalPath));
  }

  console.log('\n📄 验证撤销脚本内容:');
  const undoContent = fs.readFileSync(planResult.undoPath, 'utf-8').split('\n').slice(0, 12).join('\n');
  console.log(undoContent);

  console.log('\n📄 验证删除计划 JSON:');
  const planObj = JSON.parse(fs.readFileSync(planResult.planPath, 'utf-8'));
  console.log('  - dryRun:', planObj.dryRun);
  console.log('  - actions.length:', planObj.actions.length);
  console.log('  - undoList:', planObj.undoList);

  console.log('\n🔍 JSON 报告输出测试:');
  const jsonReport = JSON.stringify({
    summary: report.summary,
    sizeViolations: report.sizeViolations.length,
    duplicates: report.duplicates.length,
    missingAlts: report.missingAlts.length,
    unreferencedCandidates: report.unreferencedCandidates.length,
  }, null, 2);
  console.log(jsonReport);

  // 验证具体断言
  let passed = 0;
  let failed = 0;
  const assert = (name: string, cond: boolean, detail?: string) => {
    if (cond) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}${detail ? ' - ' + detail : ''}`);
      failed++;
    }
  };

  console.log('\n📋 结果断言:');
  assert('图片扫描数量应为 12', report.summary.totalImages === 12, `实际 ${report.summary.totalImages}`);
  assert('引用数量大于 0', report.summary.totalReferences > 0, `实际 ${report.summary.totalReferences}`);
  assert('检测到 icon-large 尺寸违规',
    report.sizeViolations.some(v => v.image.path.includes('icon-large')),
    '未检测到 icon-large 违规'
  );
  assert('检测到 banner-weird-ratio 比例违规',
    report.sizeViolations.some(v => v.image.path.includes('banner-weird')),
    '未检测到 banner 比例违规'
  );
  assert('检测到 banner-small 宽度违规',
    report.sizeViolations.some(v => v.image.path.includes('banner-small')),
    '未检测到 banner-small 宽度违规'
  );
  assert('检测到 avatar-rect 比例违规',
    report.sizeViolations.some(v => v.image.path.includes('avatar-rect')),
    '未检测到 avatar-rect 比例违规'
  );
  assert('检测到重复文件组', report.duplicates.length >= 1, `实际 ${report.duplicates.length} 组`);
  assert('缺失 alt 文案被检测到', report.missingAlts.length >= 1, `实际 ${report.missingAlts.length}`);
  assert('未引用素材进入候选区（unused-*.png）',
    report.unreferencedCandidates.some(c => c.image.path.includes('unused')),
    `未找到未引用候选，共 ${report.unreferencedCandidates.length} 个`
  );

  console.log(`\n🏁 测试完成: ${passed} 通过, ${failed} 失败`);
  console.log('测试目录:', testDir);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('测试执行失败:', e);
  console.error(e.stack);
  process.exit(1);
});
