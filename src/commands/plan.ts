import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { DeletionPlan, PlanParams } from '../types/index.js';
import { runScan } from './scan.js';
import { Formatter } from '../services/formatter.js';
import { BranchExecutor, type ExecutionResult } from '../services/executor.js';

export async function runPlan(params: PlanParams): Promise<{
  plan: DeletionPlan | null;
  result: ExecutionResult | null;
}> {
  const scanParams = {
    repo: params.repo,
    days: params.days,
    json: params.json,
    dryRun: params.dryRun,
    token: params.token,
    defaultBranch: params.defaultBranch,
    remote: params.remote,
  };

  const scan = await runScan(scanParams);
  const { analyzer, git } = scan;

  if (!params.json) {
    Formatter.printHeader('📋 删除计划生成');
  }

  const plan = analyzer.buildDeletionPlan(scan.analyzed, params.dryRun);

  const executor = new BranchExecutor(git, params.dryRun);
  const safety = executor.validatePlanSafety(plan);

  if (safety.warnings.length > 0 && !params.json) {
    console.log(chalk.yellow('⚠️  安全警告:'));
    for (const w of safety.warnings) {
      console.log(chalk.yellow(`  • ${w}`));
    }
  }
  if (safety.errors.length > 0 && !params.json) {
    console.log(chalk.red('❌ 安全错误:'));
    for (const e of safety.errors) {
      console.log(chalk.red(`  • ${e}`));
    }
  }

  const sanitizedPlan = executor.sanitizePlan(plan);

  if (params.outputFile) {
    const outPath = path.resolve(params.outputFile);
    const planJson = Formatter.toJson({ ...sanitizedPlan, confirmed: false });
    fs.writeFileSync(outPath, planJson, 'utf8');
    if (!params.json) {
      console.log(chalk.green(`\n💾 删除计划已保存到: ${outPath}`));
    }
  }

  if (params.json) {
    console.log(Formatter.toJson({
      plan: sanitizedPlan,
      safety,
      dryRun: params.dryRun,
    }));
    return { plan: sanitizedPlan, result: null };
  }

  Formatter.printDeletionPlan(sanitizedPlan);

  let result: ExecutionResult | null = null;
  if (params.confirm) {
    if (sanitizedPlan.branchesToDelete.length > 0) {
      if (params.dryRun) {
        console.log(chalk.cyan('\n[DRY-RUN] 模拟执行模式：不会真正删除分支\n'));
      }

      const confirmed = await executor.askUserConfirmation(
        sanitizedPlan,
        params.autoApprove === true
      );

      if (confirmed) {
        result = await executor.executeDeletion(sanitizedPlan);
        sanitizedPlan.confirmed = true;
        sanitizedPlan.executed = !params.dryRun
          ? result.executed.length > 0 && result.failed.length === 0
          : false;

        Formatter.printExecutionResult(
          result.executed,
          result.failed,
          params.dryRun
        );
      }
    } else {
        console.log(chalk.gray('\n无需执行删除操作。'));
    }
  } else {
    console.log();
    console.log(chalk.yellow(
      'ℹ️  未传入 --confirm 参数，仅生成计划，不会执行删除。'
    ));
    console.log(chalk.cyan(
      '   如需执行删除，请重新运行并加上 --confirm 并按需添加 --auto-approve 跳过确认。'
    ));
  }

  if (sanitizedPlan.branchesToDelete.length > 0 && !params.confirm) {
    console.log();
    console.log(chalk.italic(
      `建议：先使用 --output-file 保存计划，人工确认无误后再执行。`
    ));
  }

  return { plan: sanitizedPlan, result };
}
