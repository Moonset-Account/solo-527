import fs from 'node:fs';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { normalizePath } from './utils/path';
import type { AuditConfig, GlobalSizeConfig, DynamicRefRule, SizeRule } from './types';
import { runAudit } from './engine/auditEngine';
import { createProgress } from './utils/progress';
import { renderConsoleReport, toJSONSerializableReport } from './output/consoleReporter';
import { generateDeletePlan, executeDeletePlan, GeneratePlanResult } from './output/deletePlan';

interface CliArgs {
  dir: string;
  manifest?: string;
  include: string[];
  ignore: string[];
  json: boolean;
  'dry-run': boolean;
  progress: boolean;
  'no-progress': boolean;
  'delete-plan'?: string;
  'include-unreferenced': boolean;
  'score-threshold': number;
  config?: string;
  'min-width'?: number;
  'max-width'?: number;
  'min-height'?: number;
  'max-height'?: number;
  ratios?: string[];
  'dynamic-ref': string[];
  'candidate-threshold': number;
  'report-out'?: string;
  base?: string;
  color?: boolean;
}

interface ConfigFile {
  imageDir?: string;
  manifestPath?: string;
  include?: string[];
  ignore?: string[];
  sizeRules?: GlobalSizeConfig;
  dynamicRefs?: DynamicRefRule[];
  deletePlanPath?: string;
  candidateThreshold?: number;
  baseDir?: string;
}

function loadConfigFile(configPath?: string): ConfigFile {
  if (!configPath) return {};
  const resolved = normalizePath(configPath);
  if (!fs.existsSync(resolved)) {
    console.error(`配置文件不存在: ${resolved}`);
    process.exit(1);
  }
  try {
    const content = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(content) as ConfigFile;
  } catch (err) {
    console.error(`解析配置文件失败: ${(err as Error).message}`);
    process.exit(1);
  }
}

function buildSizeConfig(args: CliArgs, fileConfig: ConfigFile): GlobalSizeConfig {
  if (fileConfig.sizeRules) return fileConfig.sizeRules;

  const cliRule: SizeRule = {};
  if (args['min-width'] !== undefined) cliRule.minWidth = args['min-width'];
  if (args['max-width'] !== undefined) cliRule.maxWidth = args['max-width'];
  if (args['min-height'] !== undefined) cliRule.minHeight = args['min-height'];
  if (args['max-height'] !== undefined) cliRule.maxHeight = args['max-height'];
  if (args.ratios && args.ratios.length > 0) cliRule.allowedRatios = args.ratios;

  const hasCli = Object.keys(cliRule).length > 0;
  if (hasCli) return { default: cliRule };

  return {
    default: {
      maxWidth: 8192,
      maxHeight: 8192,
    },
    byFormat: {
      ico: {
        maxWidth: 256,
        maxHeight: 256,
        allowedRatios: ['1:1'],
      },
    },
  };
}

function parseDynamicRefs(raw: string[]): DynamicRefRule[] {
  const result: DynamicRefRule[] = [];
  for (const r of raw || []) {
    const eq = r.indexOf('=');
    if (eq > 0) {
      result.push({
        pattern: r.slice(0, eq).trim(),
        glob: r.slice(eq + 1).trim(),
      });
    } else {
      result.push({
        pattern: `custom_${result.length}`,
        glob: r.trim(),
      });
    }
  }
  return result;
}

function mergeConfigs(args: CliArgs, fileConfig: ConfigFile): AuditConfig {
  const baseDir = normalizePath(args.base ?? fileConfig.baseDir ?? process.cwd());
  const imageDir = normalizePath(path.isAbsolute(args.dir) ? args.dir : path.join(baseDir, args.dir));

  const manifestPath = args.manifest
    ? normalizePath(path.isAbsolute(args.manifest) ? args.manifest : path.join(baseDir, args.manifest))
    : fileConfig.manifestPath
      ? normalizePath(fileConfig.manifestPath)
      : undefined;

  const include = args.include.length > 0 ? args.include : fileConfig.include ?? [];
  const ignore = args.ignore.length > 0 ? args.ignore : fileConfig.ignore ?? [];

  const dynamicRefsFromFile = fileConfig.dynamicRefs ?? [];
  const dynamicRefsFromCli = parseDynamicRefs(args['dynamic-ref'] ?? []);

  const deletePlanPath = args['delete-plan']
    ? normalizePath(path.isAbsolute(args['delete-plan']) ? args['delete-plan'] : path.join(baseDir, args['delete-plan']))
    : fileConfig.deletePlanPath
      ? normalizePath(fileConfig.deletePlanPath)
      : undefined;

  return {
    imageDir,
    manifestPath,
    include,
    ignore,
    sizeRules: buildSizeConfig(args, fileConfig),
    dynamicRefs: [...dynamicRefsFromFile, ...dynamicRefsFromCli],
    json: args.json,
    dryRun: args['dry-run'],
    progress: !args['no-progress'] && args.progress !== false,
    deletePlanPath,
    candidateThreshold: args['candidate-threshold'] ?? fileConfig.candidateThreshold ?? 0,
  };
}

async function main(): Promise<void> {
  const parser = yargs(hideBin(process.argv))
    .scriptName('image-audit')
    .usage('$0 <dir> [options]', '扫描图片目录和引用清单，校验素材合规性', (y) =>
      y.positional('dir', {
        describe: '图片根目录',
        type: 'string',
        demandOption: true,
      }),
    )
    .option('manifest', {
      alias: 'm',
      type: 'string',
      describe: '引用清单文件路径 (JSON / TXT)',
    })
    .option('include', {
      alias: 'i',
      type: 'array',
      string: true,
      default: [],
      describe: '包含的 glob 模式（可重复）',
    })
    .option('ignore', {
      alias: 'I',
      type: 'array',
      string: true,
      default: [],
      describe: '忽略的 glob 模式（可重复）',
    })
    .option('json', {
      alias: 'j',
      type: 'boolean',
      default: false,
      describe: '以 JSON 格式输出报告到 stdout',
    })
    .option('dry-run', {
      alias: 'n',
      type: 'boolean',
      default: true,
      describe: '试运行模式（默认 true，不实际删除）',
    })
    .option('progress', {
      type: 'boolean',
      default: true,
      describe: '显示进度条',
    })
    .option('no-progress', {
      type: 'boolean',
      default: false,
      describe: '禁用进度条',
    })
    .option('delete-plan', {
      alias: 'd',
      type: 'string',
      describe: '生成删除计划的输出目录（仅生成计划，不执行）',
    })
    .option('include-unreferenced', {
      type: 'boolean',
      default: false,
      describe: '删除计划中包含未引用素材',
    })
    .option('score-threshold', {
      type: 'number',
      default: 0.3,
      describe: '未引用素材相似度阈值（<= 此值才加入删除计划）',
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      describe: '配置文件路径 (JSON)',
    })
    .option('min-width', { type: 'number', describe: '最小宽度 (px)' })
    .option('max-width', { type: 'number', describe: '最大宽度 (px)' })
    .option('min-height', { type: 'number', describe: '最小高度 (px)' })
    .option('max-height', { type: 'number', describe: '最大高度 (px)' })
    .option('ratios', {
      type: 'array',
      string: true,
      describe: '允许的宽高比列表，如 1:1 16:9（可重复）',
    })
    .option('dynamic-ref', {
      alias: 'D',
      type: 'array',
      string: true,
      default: [],
      describe: '动态引用规则，格式 [name=]glob（可重复）',
    })
    .option('candidate-threshold', {
      type: 'number',
      default: 0,
      describe: '候选区相似度阈值（>= 此值才进入报告）',
    })
    .option('report-out', {
      alias: 'o',
      type: 'string',
      describe: '将 JSON 报告写入文件',
    })
    .option('base', {
      alias: 'b',
      type: 'string',
      describe: '基础工作目录，用于路径归一化',
    })
    .option('color', {
      type: 'boolean',
      default: true,
      describe: '彩色输出',
    })
    .strict()
    .help()
    .alias('h', 'help')
    .version()
    .alias('v', 'version')
    .epilog(
      '示例:\n' +
        '  image-audit ./public/images\n' +
        '  image-audit ./assets -m manifest.json -j\n' +
        '  image-audit ./img --delete-plan ./plans --include-unreferenced\n' +
        '  image-audit ./img --ratios 1:1 16:9 --max-width 4096\n' +
        '  image-audit ./img -D "custom=src/**/*.mdx" -I "**/tmp/**"',
    );

  const argv = (await parser.argv) as unknown as CliArgs;
  const fileConfig = loadConfigFile(argv.config);
  const config = mergeConfigs(argv, fileConfig);
  const baseDir = argv.base ?? fileConfig.baseDir ?? process.cwd();

  const progressStream = config.json ? process.stderr : process.stdout;
  const progress = createProgress(config.progress, progressStream);

  try {
    const report = await runAudit({ config, progress, baseDir });

    if (config.json || argv['report-out']) {
      const serializable = toJSONSerializableReport(report);
      const jsonStr = JSON.stringify(serializable, null, 2);
      if (argv['report-out']) {
        const outPath = normalizePath(
          path.isAbsolute(argv['report-out']) ? argv['report-out'] : path.join(baseDir, argv['report-out']),
        );
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, jsonStr, 'utf-8');
        if (!config.json) {
          progress.log(`📄 JSON 报告已保存: ${path.relative(baseDir, outPath)}`);
        }
      }
      if (config.json) {
        process.stdout.write(jsonStr + '\n');
      }
    }

    if (!config.json) {
      const useColor = argv.color !== false && process.stdout.isTTY;
      const consoleOutput = renderConsoleReport(report, baseDir, useColor);
      process.stdout.write(consoleOutput);
    }

    if (config.deletePlanPath) {
      const result: GeneratePlanResult = await generateDeletePlan({
        report,
        dryRun: config.dryRun,
        outputDir: config.deletePlanPath,
        includeUnreferenced: argv['include-unreferenced'],
        unreferencedScoreThreshold: argv['score-threshold'],
        progress,
        baseDir,
      });

      if (!config.dryRun) {
        progress.log('⚠️  即将执行删除计划（文件将被移动到备份目录）...');
        const execResult = await executeDeletePlan(result.plan, progress);
        progress.log(`执行结果: 成功 ${execResult.success}，失败 ${execResult.failed.length}`);
        if (execResult.failed.length > 0) {
          for (const f of execResult.failed) {
            progress.log(`  ✗ ${f.path}: ${f.error}`);
          }
        }
      } else {
        progress.log(`🔍 DRY-RUN: 计划包含 ${result.plan.actions.length} 项操作。使用 --no-dry-run 实际执行。`);
      }
    }

    const hasIssues =
      report.sizeViolations.length > 0 ||
      report.duplicates.length > 0 ||
      report.missingAlts.length > 0;
    process.exit(hasIssues && config.json === false ? 2 : 0);
  } catch (err) {
    progress.stop();
    console.error(`\n❌ 校验失败: ${(err as Error).message}`);
    console.error((err as Error).stack);
    process.exit(1);
  }
}

main();
