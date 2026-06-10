#!/usr/bin/env node
import yargs, { type Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { runScan } from './commands/scan.js';
import { runPlan } from './commands/plan.js';
import { runExport } from './commands/export.js';
import type { ScanParams, PlanParams, ExportParams } from './types/index.js';

const defaultDays = 30;

function buildSharedOptions<T>(y: Argv<T>) {
  return y
    .option('repo', {
      type: 'string',
      demandOption: true,
      describe: 'Git 仓库本地路径或 GitHub 仓库地址 (owner/name)',
      alias: 'r',
    })
    .option('days', {
      type: 'number',
      default: defaultDays,
      describe: `判断分支陈旧的天数阈值 (默认: ${defaultDays})`,
      alias: 'd',
    })
    .option('json', {
      type: 'boolean',
      default: false,
      describe: '以 JSON 格式输出结果',
      alias: 'j',
    })
    .option('dry-run', {
      type: 'boolean',
      default: false,
      describe: '试运行模式，不做任何修改',
      alias: 'n',
    })
    .option('token', {
      type: 'string',
      describe: 'GitHub Personal Access Token (也可通过 GITHUB_TOKEN 环境变量设置)',
      alias: 't',
    })
    .option('default-branch', {
      type: 'string',
      describe: '指定默认分支名 (自动检测失败时使用)',
    })
    .option('remote', {
      type: 'string',
      default: 'origin',
      describe: '远端名称 (默认: origin)',
    })
    .help('help')
    .alias('help', 'h')
    .version()
    .alias('version', 'v');
}

function errorHandler(err: unknown, argv: any) {
  const isJson = argv.json || false;
  if (isJson) {
    console.log(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }, null, 2));
  } else {
    console.error(chalk.red.bold('\n❌ 执行失败!'));
    console.error(chalk.red(`  ${err instanceof Error ? err.message : String(err)}`));
    if (process.env.DEBUG && err instanceof Error && err.stack) {
      console.error(chalk.gray('\n调试信息:'));
      console.error(chalk.gray(err.stack));
    }
  }
  process.exit(1);
}

async function main() {
  const parser = yargs(hideBin(process.argv))
    .scriptName('git-clean')
    .usage(chalk.cyan.bold('\nGit 分支清理 CLI - 研发负责人月度整理工具'))
    .usage(chalk.gray('\n用法: git-clean <command> [options]'))
    .epilog(
      chalk.gray(
        '\n示例:\n' +
        '  git-clean scan --repo /path/to/repo --days 30\n' +
        '  git-clean scan --repo owner/repo --token ghp_xxx\n' +
        '  git-clean plan --repo /path/to/repo --days 60 --confirm\n' +
        '  git-clean plan --repo /path/to/repo --output-file plan.json --dry-run\n' +
        '  git-clean export --repo /path/to/repo --output report.md --format md\n' +
        '  git-clean export --repo /path/to/repo --output report.csv --format csv --include-plan'
      )
    );

  parser.command(
    'scan',
    chalk.yellow('扫描远端分支，输出分类分析结果（不会做任何修改）'),
    (y) => buildSharedOptions(y),
    async (argv: any) => {
      try {
        const params: ScanParams = {
          repo: argv.repo as string,
          days: argv.days as number,
          json: argv.json as boolean,
          dryRun: argv.dryRun as boolean,
          token: argv.token as string | undefined,
          defaultBranch: argv.defaultBranch as string | undefined,
          remote: argv.remote as string | undefined,
        };
        await runScan(params);
      } catch (err) {
        errorHandler(err, argv);
      }
    }
  );

  parser.command(
    'plan',
    chalk.yellow('生成删除计划，列出候选分支、提交人、关联 PR（需 --confirm 才会实际删除）'),
    (y) =>
      buildSharedOptions(y)
        .option('confirm', {
          type: 'boolean',
          default: false,
          describe: '确认后进入删除流程（仍需人工二次确认，除非 --auto-approve）',
        })
        .option('auto-approve', {
          type: 'boolean',
          default: false,
          describe: '跳过所有人工确认环节（危险！需配合 --confirm）',
        })
        .option('output-file', {
          type: 'string',
          describe: '将删除计划保存为 JSON 文件路径',
          alias: 'o',
        }),
    async (argv: any) => {
      try {
        const params: PlanParams = {
          repo: argv.repo as string,
          days: argv.days as number,
          json: argv.json as boolean,
          dryRun: argv.dryRun as boolean,
          token: argv.token as string | undefined,
          defaultBranch: argv.defaultBranch as string | undefined,
          remote: argv.remote as string | undefined,
          confirm: argv.confirm as boolean,
          autoApprove: argv.autoApprove as boolean,
          outputFile: argv.outputFile as string | undefined,
        };
        await runPlan(params);
      } catch (err) {
        errorHandler(err, argv);
      }
    }
  );

  parser.command(
    'export',
    chalk.yellow('导出完整报告（JSON / CSV / Markdown）'),
    (y) =>
      buildSharedOptions(y)
        .option('output', {
          type: 'string',
          demandOption: true,
          describe: '输出文件路径',
          alias: 'o',
        })
        .option('format', {
          type: 'string',
          choices: ['json', 'csv', 'md', 'markdown'],
          default: 'json',
          describe: '导出格式 (默认: json，可根据文件扩展名自动推断)',
          alias: 'f',
        })
        .option('include-plan', {
          type: 'boolean',
          default: false,
          describe: '同时包含删除计划数据',
        }),
    async (argv: any) => {
      try {
        const formatStr = argv.format as string;
        const params: ExportParams = {
          repo: argv.repo as string,
          days: argv.days as number,
          json: argv.json as boolean,
          dryRun: argv.dryRun as boolean,
          token: argv.token as string | undefined,
          defaultBranch: argv.defaultBranch as string | undefined,
          remote: argv.remote as string | undefined,
          output: argv.output as string,
          format: (formatStr === 'markdown' ? 'md' : formatStr) as 'json' | 'csv' | 'md',
          includePlan: argv.includePlan as boolean | undefined,
        };
        await runExport(params);
      } catch (err) {
        errorHandler(err, argv);
      }
    }
  );

  parser.demandCommand(1, chalk.red('请指定命令: scan | plan | export'))
    .strictCommands();

  await parser.parseAsync();
}

main().catch((err) => {
  console.error(chalk.red.bold('致命错误:'), err);
  process.exit(1);
});
