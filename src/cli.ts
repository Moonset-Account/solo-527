#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { CLIOptions } from './types';
import { CodeScanner } from './scanners/code-scanner';
import { ConfigCenterLoader } from './loaders/config-loader';
import { DeployEnvLoader } from './loaders/deploy-loader';
import { OwnerLoader } from './loaders/owner-loader';
import { DiffEngine } from './engine/diff-engine';
import { Reporter } from './reporter/reporter';
import { valueToString } from './utils';
import * as fs from 'fs';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('ff-drift')
    .usage('$0 <command> [options]')
    .version('1.0.0')
    .option('code', {
      alias: 'c',
      type: 'array',
      describe: 'Paths to scan for code defaults (files or directories)',
      default: [],
    })
    .option('config', {
      alias: 'C',
      type: 'array',
      describe: 'Config center files (JSON/YAML/TOML/Properties)',
      default: [],
    })
    .option('deploy', {
      alias: 'd',
      type: 'array',
      describe: 'Deployment config files',
      default: [],
    })
    .option('env', {
      alias: 'e',
      type: 'array',
      describe: 'Environments to check (default: all)',
      default: [],
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'Output file path (stdout if not specified)',
    })
    .option('format', {
      alias: 'f',
      choices: ['json', 'table', 'markdown'] as const,
      describe: 'Output format',
      default: 'json',
    })
    .option('strict', {
      alias: 's',
      type: 'boolean',
      describe: 'Strict mode: fail with non-zero exit on production drift',
      default: false,
    })
    .option('strict-env', {
      type: 'array',
      describe: 'Environments considered "strict" (default: production, prod)',
      default: ['production', 'prod'],
    })
    .option('owners', {
      alias: 'O',
      type: 'string',
      describe: 'Owner config file path',
    })
    .option('include-info', {
      type: 'boolean',
      describe: 'Include info-level drifts',
      default: true,
    })
    .option('deprecated-only', {
      type: 'boolean',
      describe: 'Only report deprecated flags in use',
      default: false,
    })
    .command(
      'diff',
      'Run drift comparison and generate report',
      (y) => y,
      async (args) => {
        await runDiff(args as unknown as CLIOptions & { strictEnv?: string[] });
      }
    )
    .command(
      'owners',
      'List flag owners and their associated flags/drifts',
      (y) => y
        .option('summary', {
          type: 'boolean',
          default: false,
          describe: 'Show only summary without drift details',
        }),
      async (args) => {
        await runOwners(args as unknown as CLIOptions & { strictEnv?: string[]; summary?: boolean });
      }
    )
    .command(
      'export',
      'Export consolidated flag data',
      (y) => y
        .option('include-sources', {
          type: 'boolean',
          default: false,
          describe: 'Include source location info',
        })
        .option('by-env', {
          type: 'boolean',
          default: false,
          describe: 'Group export by environment',
        }),
      async (args) => {
        await runExport(args as unknown as CLIOptions & { includeSources?: boolean; byEnv?: boolean });
      }
    )
    .example(
      '$0 diff -c ./src -C ./config/prod.json -d ./deploy/prod.yaml -s -o report.json',
      'Strict production check, output JSON report'
    )
    .example(
      '$0 owners -c ./src -C ./config/ -f table',
      'Show owner overview in table format'
    )
    .example(
      '$0 export -c ./src -C ./config/ -d ./deploy/ --by-env -o flags.json',
      'Export all flags grouped by environment'
    )
    .demandCommand(1, 'You need to specify a command: diff, owners, or export')
    .help()
    .argv;

  void argv;
}

async function loadAllData(options: CLIOptions & { strictEnv?: string[] }) {
  const codePaths = options.codePaths || options.code || [];
  const configFiles = options.configFiles || options.config || [];
  const deployFiles = options.deployFiles || options.deploy || [];
  const environments = options.environments || options.env || [];

  const codeScanner = new CodeScanner({
    paths: codePaths.length > 0 ? codePaths : ['.'],
  });
  const configLoader = new ConfigCenterLoader({
    files: configFiles,
    environments: environments.length > 0 ? environments : undefined,
  });
  const deployLoader = new DeployEnvLoader({
    files: deployFiles,
    environments: environments.length > 0 ? environments : undefined,
  });
  const ownerLoader = new OwnerLoader({
    ownerFile: options.ownerFile,
  });

  const [codeFlags, configFlags, deployFlags, ownerConfig] = await Promise.all([
    codePaths.length > 0 ? codeScanner.scan() : Promise.resolve([]),
    configFiles.length > 0 ? configLoader.load() : Promise.resolve([]),
    deployFiles.length > 0 ? deployLoader.load() : Promise.resolve([]),
    ownerLoader.load(),
  ]);

  return {
    codeFlags,
    configFlags,
    deployFlags,
    ownerConfig,
    ownerLoader,
    codePaths,
    configFiles,
    deployFiles,
  };
}

async function runDiff(
  options: CLIOptions & { strictEnv?: string[] }
): Promise<void> {
  const {
    codeFlags,
    configFlags,
    deployFlags,
    ownerConfig,
    ownerLoader,
    codePaths,
    configFiles,
    deployFiles,
  } = await loadAllData(options);

  const diffEngine = new DiffEngine(
    {
      strict: options.strict,
      strictEnvironments: options.strictEnv,
      includeInfo: options.includeInfo,
    },
    ownerLoader
  );

  const drifts = await diffEngine.diff(codeFlags, configFlags, deployFlags, ownerConfig);
  const strictResult = diffEngine.isStrictModeFailure(drifts);

  const reporter = new Reporter({
    outputPath: options.output,
    format: options.format,
    includeInfo: options.includeInfo,
    deprecatedOnly: options.deprecatedOnly,
  });

  const report = reporter.generate(
    codeFlags,
    configFlags,
    deployFlags,
    drifts,
    strictResult,
    {
      codePaths,
      configFiles,
      deployFiles,
    }
  );

  const output = await reporter.write(report);

  if (!options.output) {
    process.stdout.write(output + '\n');
  } else {
    console.error(`Report written to ${options.output}`);
  }

  if (options.strict && strictResult.failed) {
    console.error(`\nStrict mode failed: ${strictResult.reasons.length} issue(s) found in production environments`);
    process.exit(1);
  }

  if (drifts.length > 0 && !options.strict && report.summary.bySeverity.critical > 0) {
    process.exitCode = 2;
  }
}

async function runOwners(
  options: CLIOptions & { strictEnv?: string[]; summary?: boolean }
): Promise<void> {
  const {
    codeFlags,
    configFlags,
    deployFlags,
    ownerConfig,
    ownerLoader,
  } = await loadAllData(options);

  const diffEngine = new DiffEngine(
    {
      strict: options.strict,
      strictEnvironments: options.strictEnv,
      includeInfo: options.includeInfo,
    },
    ownerLoader
  );

  const drifts = await diffEngine.diff(codeFlags, configFlags, deployFlags, ownerConfig);
  const strictResult = diffEngine.isStrictModeFailure(drifts);

  const reporter = new Reporter({
    outputPath: options.output,
    format: options.format,
    includeInfo: options.includeInfo,
    deprecatedOnly: options.deprecatedOnly,
  });

  const report = reporter.generate(
    codeFlags,
    configFlags,
    deployFlags,
    drifts,
    strictResult,
    {
      codePaths: options.codePaths || options.code || [],
      configFiles: options.configFiles || options.config || [],
      deployFiles: options.deployFiles || options.deploy || [],
    }
  );

  const ownerReport = {
    generatedAt: report.generatedAt,
    schemaVersion: report.schemaVersion,
    totalOwners: report.byOwner.length,
    unassignedCount: report.unassignedDrifts.length,
    summary: {
      total: report.summary.totalDrifts,
      critical: report.summary.bySeverity.critical,
      warning: report.summary.bySeverity.warning,
      info: report.summary.bySeverity.info,
    },
    owners: report.byOwner.map(o => ({
      owner: o.owner,
      totalDrifts: o.totalDrifts,
      criticalCount: o.criticalCount,
      warningCount: o.warningCount,
      infoCount: o.infoCount,
      affectedFlags: o.flags,
      drifts: options.summary ? undefined : o.drifts,
    })),
    unassigned: options.summary ? report.unassignedDrifts.map(d => ({
      key: d.key,
      severity: d.severity,
      type: d.type,
      environments: d.environments,
    })) : report.unassignedDrifts,
  };

  let output: string;

  if (options.format === 'json') {
    output = JSON.stringify(ownerReport, null, 2);
  } else if (options.format === 'table') {
    const lines: string[] = [];
    lines.push('=== Flag Owners Report ===');
    lines.push(`Generated: ${ownerReport.generatedAt}`);
    lines.push(`Total Owners: ${ownerReport.totalOwners}`);
    lines.push(`Unassigned Drifts: ${ownerReport.unassignedCount}`);
    lines.push('');

    lines.push('--- Owner Summary ---');
    const pad = (s: string, n: number) => s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
    lines.push(pad('Owner', 25) + pad('Critical', 10) + pad('Warning', 10) + pad('Info', 8) + 'Affected Flags');
    lines.push('-'.repeat(80));

    for (const o of ownerReport.owners) {
      lines.push(
        pad(o.owner, 25) +
        pad(String(o.criticalCount), 10) +
        pad(String(o.warningCount), 10) +
        pad(String(o.infoCount), 8) +
        o.affectedFlags.join(', ')
      );
    }

    if (ownerReport.unassigned.length > 0 && Array.isArray(ownerReport.unassigned[0])) {
      lines.push('\n--- Unassigned Drifts (need owners!) ---');
      for (const u of ownerReport.unassigned as Array<{ key: string; severity: string; type: string }>) {
        lines.push(`  [${u.severity.toUpperCase()}] ${u.key} - ${u.type}`);
      }
    }

    output = lines.join('\n');
  } else {
    const lines: string[] = [];
    lines.push('# Flag Owners Report');
    lines.push('');
    lines.push(`*Generated at: ${ownerReport.generatedAt}*`);
    lines.push('');
    lines.push(`- **Total Owners**: ${ownerReport.totalOwners}`);
    lines.push(`- **Unassigned Drifts**: ${ownerReport.unassignedCount}`);
    lines.push('');

    lines.push('## Owner Summary');
    lines.push('');
    lines.push('| Owner | Critical | Warning | Info | Total | Flags |');
    lines.push('|-------|----------|---------|------|-------|-------|');
    for (const o of ownerReport.owners) {
      lines.push(
        `| ${o.owner} | ${o.criticalCount} | ${o.warningCount} | ${o.infoCount} | ${o.totalDrifts} | ${o.affectedFlags.join(', ')} |`
      );
    }

    if (!options.summary) {
      for (const o of ownerReport.owners) {
        if (o.drifts && o.drifts.length > 0) {
          lines.push('');
          lines.push(`### ${o.owner} — Details`);
          lines.push('');
          for (const d of o.drifts as unknown as Array<{ key: string; type: string; severity: string; description: string }>) {
            lines.push(`- **${d.key}** (\`${d.type}\`, ${d.severity}) — ${d.description}`);
          }
        }
      }
    }

    output = lines.join('\n');
  }

  if (options.output) {
    fs.writeFileSync(options.output, output, 'utf-8');
    console.error(`Owner report written to ${options.output}`);
  } else {
    process.stdout.write(output + '\n');
  }

  if (ownerReport.unassignedCount > 0) {
    process.exitCode = 3;
  }
}

async function runExport(
  options: CLIOptions & { includeSources?: boolean; byEnv?: boolean }
): Promise<void> {
  const {
    codeFlags,
    configFlags,
    deployFlags,
  } = await loadAllData(options);

  const allKeys = new Set<string>([
    ...codeFlags.map(f => f.key),
    ...configFlags.map(f => f.key),
    ...deployFlags.map(f => f.key),
  ]);

  let exportData: unknown;

  if (options.byEnv) {
    const envs = new Set<string>();
    for (const f of configFlags) envs.add(f.environment);
    for (const f of deployFlags) envs.add(f.environment);
    if (envs.size === 0) envs.add('default');

    const byEnvData: Record<string, Array<{
      key: string;
      codeDefault?: unknown;
      configValue?: unknown;
      deployValue?: unknown;
      type?: string;
      owner?: string;
      deprecated?: boolean;
      sources?: unknown;
    }>> = {};

    for (const env of envs) {
      byEnvData[env] = [];
      for (const key of allKeys) {
        const code = codeFlags.find(f => f.key === key);
        const config = configFlags.find(f => f.key === key && f.environment === env);
        const deploy = deployFlags.find(f => f.key === key && f.environment === env);

        if (!code && !config && !deploy) continue;

        const entry: {
          key: string;
          codeDefault?: unknown;
          configValue?: unknown;
          deployValue?: unknown;
          type?: string;
          owner?: string;
          deprecated?: boolean;
          sources?: unknown;
        } = { key };

        if (code) {
          entry.codeDefault = code.value;
          entry.type = code.type;
          entry.owner = code.owner;
          entry.deprecated = code.deprecated;
        }
        if (config) {
          entry.configValue = config.value;
          if (!entry.type) entry.type = config.type;
          if (!entry.owner && config.owner) entry.owner = config.owner;
          if (!entry.deprecated && config.deprecated) entry.deprecated = config.deprecated;
        }
        if (deploy) {
          entry.deployValue = deploy.value;
          if (!entry.type) entry.type = deploy.type;
        }

        if (options.includeSources) {
          entry.sources = {
            code: code ? { file: code.file, line: code.line } : undefined,
            config: config ? { updatedAt: config.updatedAt, updatedBy: config.updatedBy } : undefined,
            deploy: deploy ? { cluster: deploy.cluster, lastModified: deploy.lastModified } : undefined,
          };
        }

        byEnvData[env].push(entry);
      }
    }

    exportData = byEnvData;
  } else {
    const flatExport: Array<{
      key: string;
      type?: string;
      owner?: string;
      deprecated?: boolean;
      codeDefault?: unknown;
      environments: Record<string, {
        configValue?: unknown;
        deployValue?: unknown;
      }>;
      sources?: unknown;
    }> = [];

    for (const key of allKeys) {
      const code = codeFlags.find(f => f.key === key);
      const keyConfigs = configFlags.filter(f => f.key === key);
      const keyDeploys = deployFlags.filter(f => f.key === key);

      const envs = new Set<string>();
      for (const k of keyConfigs) envs.add(k.environment);
      for (const k of keyDeploys) envs.add(k.environment);
      if (envs.size === 0) envs.add('default');

      const environments: Record<string, { configValue?: unknown; deployValue?: unknown }> = {};
      for (const env of envs) {
        const cfg = keyConfigs.find(f => f.environment === env);
        const dep = keyDeploys.find(f => f.environment === env);
        environments[env] = {
          configValue: cfg?.value,
          deployValue: dep?.value,
        };
      }

      const entry: typeof flatExport[0] = {
        key,
        type: code?.type || keyConfigs[0]?.type || keyDeploys[0]?.type,
        owner: code?.owner || keyConfigs.find(c => c.owner)?.owner,
        deprecated: code?.deprecated || keyConfigs.some(c => c.deprecated),
        codeDefault: code?.value,
        environments,
      };

      if (options.includeSources) {
        entry.sources = {
          code: code ? { file: code.file, line: code.line } : undefined,
        };
      }

      flatExport.push(entry);
    }

    flatExport.sort((a, b) => a.key.localeCompare(b.key));
    exportData = flatExport;
  }

  const output = JSON.stringify(exportData, null, 2);

  if (options.output) {
    fs.writeFileSync(options.output, output, 'utf-8');
    console.error(`Export written to ${options.output}`);
  } else {
    process.stdout.write(output + '\n');
  }
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
