import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { DeletionPlan, PlanParams } from '../types/index.js';
import type { ExecutionResult } from '../services/executor.js';
import { runScan } from './scan.js';
import { Formatter } from '../services/formatter.js';
import { BranchExecutor } from '../services/executor.js';

export async function runPlan(
  params: PlanParams
): Promise<{ plan: DeletionPlan | null; result: ExecutionResult | null }> {
  const scanParams = {
    repo: params.repo,
    days: params.days,
    json: params.json,
    dryRun: params.dryRun,
    token: params.token,
    defaultBranch: params.defaultBranch,
    remote: params.remote,
    githubOwner: params.githubOwner,
    githubRepo: params.githubRepo,
  };

  const scan = await runScan(scanParams);
  const { analyzer, git, context } = scan;

  if (!git && !params.json) {
    console.log(
      chalk.yellow(
        '\n⚠️  当前使用 GitHub API 模式获取分支，删除操作仍需要本地 Git 仓库路径才能执行 git push --delete'
      )
    );
  }

  if (!params.confirm) {
    if (!params.json) {
      console.log();
      Formatter.printHeader('📋 删除计划模式');
      console.log();
      console.log(
        chalk.yellow.bold(
          'ℹ️  未传入 --confirm 参数：仅展示分析结果，**不会生成删除计划**，更不会执行删除。'
        )
      );
      console.log();
      console.log(
        chalk.gray(
          '  要生成正式的删除计划（DeletionPlan）并进入执行流程，请重新运行并加上 --confirm：'
        )
      );
      console.log();
      console.log(
        chalk.cyan(
          `    npm run dev -- plan --repo ${JSON.stringify(params.repo)} --days ${params.days} --confirm`
        )
      );
      console.log();
      console.log(
        chalk.gray(
          '  进入 --confirm 流程后，会先生成完整删除计划（列出每个候选分支的最近提交人、关联 PR、'
        )
      );
      console.log(
        chalk.gray(
          '  未合并提交数等关键信息），经你人工确认后才会真正调用删除命令。'
        )
      );
      console.log();
      if (params.outputFile) {
        console.log(
          chalk.yellow(
            `  ⚠️  由于缺少 --confirm，已忽略 --output-file：${params.outputFile}`
          )
        );
        console.log();
      }
    } else {
      console.log(
        Formatter.toJson({
          success: true,
          mode: 'analysis-only',
          message:
            'Only analysis was performed. Pass --confirm to build a real DeletionPlan and proceed with deletion flow.',
          summary: scan.exportData.summary,
          confirmRequired: true,
          deletionPlanGenerated: false,
        })
      );
    }
    return { plan: null, result: null };
  }

  if (!params.json) {
    Formatter.printHeader('📋 删除计划生成（已启用确认流程）');
    console.log(
      chalk.green(
        '✓ --confirm 已传入，将生成正式 DeletionPlan；确认前**不会**调用任何删除命令。'
      )
    );
    console.log();
  }

  if (!git) {
    const errMsg =
      '生成本地可执行的删除计划需要有效的本地 Git 仓库路径（用于最终执行 git push --delete）。请使用本地路径，或同时提供 --local-path。';
    if (params.json) {
      console.log(Formatter.toJson({ success: false, error: errMsg }));
    } else {
      console.log(chalk.red(`❌ ${errMsg}`));
    }
    return { plan: null, result: null };
  }

  const plan = analyzer.buildDeletionPlan(scan.analyzed, params.dryRun);

  const executor = new BranchExecutor(git, params.dryRun);
  const safety = executor.validatePlanSafety(plan);

  if (!params.json) {
    if (safety.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  安全警告:'));
      for (const w of safety.warnings) {
        console.log(chalk.yellow(`  • ${w}`));
      }
      console.log();
    }
    if (safety.errors.length > 0) {
      console.log(chalk.red('❌ 安全错误:'));
      for (const e of safety.errors) {
        console.log(chalk.red(`  • ${e}`));
      }
      console.log();
    }
  }

  const sanitizedPlan = executor.sanitizePlan(plan);

  if (params.outputFile) {
    const outPath = path.resolve(params.outputFile);
    const parent = path.dirname(outPath);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    const planJson = Formatter.toJson({ ...sanitizedPlan, confirmed: false, executed: false });
    fs.writeFileSync(outPath, planJson, 'utf8');
    if (!params.json) {
      console.log(chalk.green(`💾 删除计划已保存到: ${outPath}`));
      console.log();
    }
  }

  if (params.json) {
    console.log(
      Formatter.toJson({
        plan: sanitizedPlan,
        safety,
        dryRun: params.dryRun,
        context,
      })
    );
    return { plan: sanitizedPlan, result: null };
  }

  console.log(chalk.bold.cyan('以下是本次生成的完整删除计划（确认前不会执行任何删除）：'));
  console.log();
  Formatter.printDeletionPlan(sanitizedPlan);

  console.log();
  console.log(chalk.bold.magenta('══════════════════════════════════════════════════════════════════'));
  console.log(
    chalk.bold.magenta(
      '  🛑  删除命令尚未执行。请仔细审查以上清单，然后在下方确认。'
    )
  );
  console.log(chalk.bold.magenta('══════════════════════════════════════════════════════════════════'));
  console.log();

  let result: ExecutionResult | null = null;
  if (sanitizedPlan.branchesToDelete.length === 0) {
    console.log(chalk.gray('删除计划为空，无需执行。'));
    return { plan: sanitizedPlan, result: null };
  }

  if (params.dryRun) {
    console.log(chalk.cyan('\n[DRY-RUN] 模拟执行模式：不会真正调用 git push --delete\n'));
  }

  const confirmed = await executor.askUserConfirmation(
    sanitizedPlan,
    params.autoApprove === true
  );

  if (!confirmed) {
    console.log(chalk.gray('\n用户取消，未调用任何删除命令。'));
    sanitizedPlan.confirmed = false;
    return { plan: sanitizedPlan, result: null };
  }

  console.log(chalk.green('\n✓ 用户确认通过，即将执行删除...'));
  result = await executor.executeDeletion(sanitizedPlan);

  sanitizedPlan.confirmed = true;
  sanitizedPlan.executed = !params.dryRun
    ? result.executed.length > 0 && result.failed.length === 0
    : false;

  Formatter.printExecutionResult(result.executed, result.failed, params.dryRun);

  return { plan: sanitizedPlan, result };
}
