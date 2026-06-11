import * as fs from 'fs';
import * as path from 'path';
import type {
  DriftReport,
  DriftItem,
  DriftType,
  DriftSeverity,
  OwnerSummary,
  CodeDefaultFlag,
  ConfigCenterFlag,
  DeployEnvFlag,
} from '../types';
import { getISODate, valueToString, truncate } from '../utils';

export interface ReporterOptions {
  outputPath?: string;
  format?: 'json' | 'table' | 'markdown';
  includeInfo?: boolean;
  deprecatedOnly?: boolean;
}

export class Reporter {
  private options: Required<ReporterOptions>;

  constructor(options: ReporterOptions = {}) {
    this.options = {
      outputPath: options.outputPath || '',
      format: options.format || 'json',
      includeInfo: options.includeInfo ?? true,
      deprecatedOnly: options.deprecatedOnly ?? false,
    };
  }

  generate(
    codeFlags: CodeDefaultFlag[],
    configFlags: ConfigCenterFlag[],
    deployFlags: DeployEnvFlag[],
    drifts: DriftItem[],
    strictModeResult: { failed: boolean; reasons: string[] },
    configSources: {
      codePaths: string[];
      configFiles: string[];
      deployFiles: string[];
    }
  ): DriftReport {
    let filteredDrifts = drifts;

    if (this.options.deprecatedOnly) {
      filteredDrifts = drifts.filter(d => d.type === 'deprecated_in_use');
    }

    if (!this.options.includeInfo) {
      filteredDrifts = filteredDrifts.filter(d => d.severity !== 'info');
    }

    const byOwner = this.buildOwnerSummaries(filteredDrifts);
    const unassignedDrifts = filteredDrifts.filter(d => !d.owner);

    const configSourceDetails = configFlags.reduce<Array<{ file: string; environment: string }>>((acc, f) => {
      const existing = acc.find(x => x.file === f.source && x.environment === f.environment);
      if (!existing) {
        acc.push({ file: f.source, environment: f.environment });
      }
      return acc;
    }, []);

    const deploySourceDetails = deployFlags.reduce<Array<{ file: string; environment: string }>>((acc, f) => {
      const existing = acc.find(x => x.file === f.source && x.environment === f.environment);
      if (!existing) {
        acc.push({ file: f.source, environment: f.environment });
      }
      return acc;
    }, []);

    const report: DriftReport = {
      generatedAt: getISODate(),
      schemaVersion: '1.0.0',
      summary: {
        totalFlags: new Set([
          ...codeFlags.map(f => f.key),
          ...configFlags.map(f => f.key),
          ...deployFlags.map(f => f.key),
        ]).size,
        codeFlags: new Set(codeFlags.map(f => f.key)).size,
        configFlags: new Set(configFlags.map(f => f.key)).size,
        deployFlags: new Set(deployFlags.map(f => f.key)).size,
        totalDrifts: filteredDrifts.length,
        byType: this.countByType(filteredDrifts),
        bySeverity: this.countBySeverity(filteredDrifts),
        byEnvironment: this.countByEnvironment(filteredDrifts),
      },
      sources: {
        code: configSources.codePaths,
        configCenter: this.buildConfigSourceList(configSources.configFiles, configFlags),
        deployEnv: this.buildDeploySourceList(configSources.deployFiles, deployFlags),
      },
      drifts: filteredDrifts,
      byOwner,
      unassignedDrifts,
      strictModeFailed: strictModeResult.failed,
      strictModeReasons: strictModeResult.reasons,
    };

    return report;
  }

  async write(report: DriftReport): Promise<string> {
    let output: string;

    switch (this.options.format) {
      case 'table':
        output = this.formatAsTable(report);
        break;
      case 'markdown':
        output = this.formatAsMarkdown(report);
        break;
      case 'json':
      default:
        output = JSON.stringify(report, null, 2);
    }

    if (this.options.outputPath) {
      const resolved = path.resolve(this.options.outputPath);
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(resolved, output, 'utf-8');
      return resolved;
    }

    return output;
  }

  private buildOwnerSummaries(drifts: DriftItem[]): OwnerSummary[] {
    const ownerMap = new Map<string, OwnerSummary>();

    for (const drift of drifts) {
      if (!drift.owner) continue;

      if (!ownerMap.has(drift.owner)) {
        ownerMap.set(drift.owner, {
          owner: drift.owner,
          totalDrifts: 0,
          criticalCount: 0,
          warningCount: 0,
          infoCount: 0,
          drifts: [],
          flags: [],
        });
      }

      const summary = ownerMap.get(drift.owner)!;
      summary.totalDrifts++;
      summary.drifts.push(drift);

      if (!summary.flags.includes(drift.key)) {
        summary.flags.push(drift.key);
      }

      switch (drift.severity) {
        case 'critical':
          summary.criticalCount++;
          break;
        case 'warning':
          summary.warningCount++;
          break;
        case 'info':
          summary.infoCount++;
          break;
      }
    }

    return Array.from(ownerMap.values()).sort((a, b) => {
      const criticalDiff = b.criticalCount - a.criticalCount;
      if (criticalDiff !== 0) return criticalDiff;
      const warningDiff = b.warningCount - a.warningCount;
      if (warningDiff !== 0) return warningDiff;
      return b.totalDrifts - a.totalDrifts;
    });
  }

  private countByType(drifts: DriftItem[]): Record<DriftType, number> {
    const result: Record<DriftType, number> = {
      missing_in_config: 0,
      missing_in_deploy: 0,
      missing_in_code: 0,
      default_mismatch: 0,
      deploy_mismatch: 0,
      deprecated_in_use: 0,
      type_mismatch: 0,
    };

    for (const d of drifts) {
      result[d.type]++;
    }

    return result;
  }

  private countBySeverity(drifts: DriftItem[]): Record<DriftSeverity, number> {
    const result: Record<DriftSeverity, number> = {
      critical: 0,
      warning: 0,
      info: 0,
    };

    for (const d of drifts) {
      result[d.severity]++;
    }

    return result;
  }

  private countByEnvironment(drifts: DriftItem[]): Record<string, number> {
    const result: Record<string, number> = {};

    for (const d of drifts) {
      for (const env of d.environments || []) {
        result[env] = (result[env] || 0) + 1;
      }
    }

    return result;
  }

  private buildConfigSourceList(
    files: string[],
    flags: ConfigCenterFlag[]
  ): Array<{ file: string; environment: string }> {
    const byEnv = new Map<string, Set<string>>();

    for (const f of flags) {
      if (!byEnv.has(f.environment)) {
        byEnv.set(f.environment, new Set());
      }
      byEnv.get(f.environment)!.add(f.source);
    }

    const result: Array<{ file: string; environment: string }> = [];
    for (const file of files) {
      let matched = false;
      for (const [env, sources] of byEnv) {
        if (sources.has(file) || file.includes(env)) {
          result.push({ file, environment: env });
          matched = true;
        }
      }
      if (!matched) {
        result.push({ file, environment: 'default' });
      }
    }

    return result;
  }

  private buildDeploySourceList(
    files: string[],
    flags: DeployEnvFlag[]
  ): Array<{ file: string; environment: string }> {
    const byEnv = new Map<string, Set<string>>();

    for (const f of flags) {
      if (!byEnv.has(f.environment)) {
        byEnv.set(f.environment, new Set());
      }
      byEnv.get(f.environment)!.add(f.source);
    }

    const result: Array<{ file: string; environment: string }> = [];
    for (const file of files) {
      let matched = false;
      for (const [env, sources] of byEnv) {
        if (sources.has(file) || file.includes(env)) {
          result.push({ file, environment: env });
          matched = true;
        }
      }
      if (!matched) {
        result.push({ file, environment: 'default' });
      }
    }

    return result;
  }

  private formatAsTable(report: DriftReport): string {
    const lines: string[] = [];

    lines.push('=== Feature Flag Drift Report ===');
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push('');

    lines.push('--- Summary ---');
    const s = report.summary;
    lines.push(`Total Flags: ${s.totalFlags} (Code: ${s.codeFlags}, Config: ${s.configFlags}, Deploy: ${s.deployFlags})`);
    lines.push(`Total Drifts: ${s.totalDrifts}`);
    lines.push(`  Critical: ${s.bySeverity.critical}, Warning: ${s.bySeverity.warning}, Info: ${s.bySeverity.info}`);
    lines.push('');

    if (report.strictModeFailed) {
      lines.push('>>> STRICT MODE FAILED <<<');
      for (const reason of report.strictModeReasons) {
        lines.push(`  - ${reason}`);
      }
      lines.push('');
    }

    if (report.byOwner.length > 0) {
      lines.push('--- By Owner ---');
      lines.push(this.pad('Owner', 25) + this.pad('Critical', 10) + this.pad('Warning', 10) + this.pad('Info', 8) + 'Flags');
      lines.push('-'.repeat(80));
      for (const o of report.byOwner) {
        lines.push(
          this.pad(truncate(o.owner, 24), 25) +
          this.pad(String(o.criticalCount), 10) +
          this.pad(String(o.warningCount), 10) +
          this.pad(String(o.infoCount), 8) +
          o.flags.join(', ')
        );
      }
      lines.push('');
    }

    if (report.drifts.length > 0) {
      lines.push('--- Drift Details ---');
      lines.push(
        this.pad('Severity', 10) +
        this.pad('Type', 20) +
        this.pad('Key', 35) +
        this.pad('Cluster', 12) +
        this.pad('Owner', 18) +
        this.pad('Envs', 15) +
        'Last Modified'
      );
      lines.push('-'.repeat(130));

      const sorted = [...report.drifts].sort((a, b) => {
        const rank = { critical: 0, warning: 1, info: 2 };
        if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
        return a.key.localeCompare(b.key);
      });

      for (const d of sorted) {
        lines.push(
          this.pad(d.severity.toUpperCase(), 10) +
          this.pad(truncate(d.type, 19), 20) +
          this.pad(truncate(d.key, 34), 35) +
          this.pad(truncate(d.cluster || '-', 11), 12) +
          this.pad(truncate(d.owner || 'UNASSIGNED', 17), 18) +
          this.pad(truncate((d.environments || []).join(','), 14), 15) +
          (d.lastModified || '-')
        );
      }
      lines.push('');

      for (const d of report.drifts.filter(x => x.severity !== 'info')) {
        const clusterLabel = d.cluster ? ` [${d.cluster}]` : '';
        lines.push(`[${d.severity.toUpperCase()}] ${d.key}${clusterLabel} (${d.type})`);
        lines.push(`  ${d.description}`);
        if (d.codeDefault !== undefined) {
          lines.push(`  Code Default: ${valueToString(d.codeDefault)}`);
        }
        if (d.configValue !== undefined) {
          lines.push(`  Config Value: ${valueToString(d.configValue)}`);
        }
        if (d.deployValue !== undefined) {
          lines.push(`  Deploy Value: ${valueToString(d.deployValue)}`);
        }
        lines.push('');
      }
    } else {
      lines.push('No drifts detected!');
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatAsMarkdown(report: DriftReport): string {
    const lines: string[] = [];

    lines.push('# Feature Flag Drift Report');
    lines.push('');
    lines.push(`*Generated at: ${report.generatedAt}*`);
    lines.push('');

    lines.push('## Summary');
    lines.push('');
    const s = report.summary;
    lines.push(`- **Total Flags**: ${s.totalFlags}`);
    lines.push(`  - Code-defined: ${s.codeFlags}`);
    lines.push(`  - Config Center: ${s.configFlags}`);
    lines.push(`  - Deploy Env: ${s.deployFlags}`);
    lines.push(`- **Total Drifts**: ${s.totalDrifts}`);
    lines.push(`  - 🔴 Critical: ${s.bySeverity.critical}`);
    lines.push(`  - 🟡 Warning: ${s.bySeverity.warning}`);
    lines.push(`  - 🔵 Info: ${s.bySeverity.info}`);
    lines.push('');

    if (Object.keys(s.byEnvironment).length > 0) {
      lines.push('### Drifts by Environment');
      lines.push('');
      lines.push('| Environment | Count |');
      lines.push('|-------------|-------|');
      for (const [env, count] of Object.entries(s.byEnvironment)) {
        lines.push(`| ${env} | ${count} |`);
      }
      lines.push('');
    }

    if (report.strictModeFailed) {
      lines.push('## ❌ Strict Mode Failed');
      lines.push('');
      for (const reason of report.strictModeReasons) {
        lines.push(`- ${reason}`);
      }
      lines.push('');
    }

    if (report.byOwner.length > 0) {
      lines.push('## By Owner');
      lines.push('');
      lines.push('| Owner | Critical | Warning | Info | Total | Flags |');
      lines.push('|-------|----------|---------|------|-------|-------|');
      for (const o of report.byOwner) {
        lines.push(
          `| ${o.owner} | ${o.criticalCount} | ${o.warningCount} | ${o.infoCount} | ${o.totalDrifts} | ${o.flags.join(', ')} |`
        );
      }
      lines.push('');
    }

    if (report.unassignedDrifts.length > 0) {
      lines.push(`## Unassigned Drifts (${report.unassignedDrifts.length})`);
      lines.push('');
      lines.push('| Severity | Type | Key | Envs |');
      lines.push('|----------|------|-----|------|');
      for (const d of report.unassignedDrifts) {
        const emoji = d.severity === 'critical' ? '🔴' : d.severity === 'warning' ? '🟡' : '🔵';
        lines.push(
          `| ${emoji} ${d.severity} | ${d.type} | \`${d.key}\` | ${(d.environments || []).join(', ')} |`
        );
      }
      lines.push('');
    }

    if (report.drifts.length > 0) {
      lines.push('## Drift Details');
      lines.push('');

      const critical = report.drifts.filter(d => d.severity === 'critical');
      const warnings = report.drifts.filter(d => d.severity === 'warning');
      const infos = report.drifts.filter(d => d.severity === 'info');

      const printDriftList = (title: string, list: DriftItem[]) => {
        if (list.length === 0) return;
        lines.push(`### ${title} (${list.length})`);
        lines.push('');
        for (const d of list) {
          const clusterLabel = d.cluster ? ` [${d.cluster}]` : '';
          lines.push(`#### \`${d.key}${clusterLabel}\` — ${d.type}`);
          lines.push('');
          lines.push(`- **Owner**: ${d.owner || 'Unassigned'}`);
          lines.push(`- **Environments**: ${(d.environments || []).join(', ')}`);
          if (d.cluster) lines.push(`- **Cluster**: ${d.cluster}`);
          if (d.lastModified) lines.push(`- **Last Modified**: ${d.lastModified}`);
          lines.push(`- **Description**: ${d.description}`);
          if (d.codeDefault !== undefined) lines.push(`- **Code Default**: \`${valueToString(d.codeDefault)}\``);
          if (d.configValue !== undefined) lines.push(`- **Config Value**: \`${valueToString(d.configValue)}\``);
          if (d.deployValue !== undefined) lines.push(`- **Deploy Value**: \`${valueToString(d.deployValue)}\``);
          lines.push('');
        }
      };

      printDriftList('🔴 Critical', critical);
      printDriftList('🟡 Warnings', warnings);
      printDriftList('🔵 Info', infos);
    } else {
      lines.push('## ✅ No Drifts Detected');
      lines.push('');
      lines.push('All feature flags are consistent across code defaults, config center, and deploy environments.');
    }

    return lines.join('\n');
  }

  private pad(str: string, len: number): string {
    if (str.length >= len) return str.slice(0, len);
    return str + ' '.repeat(len - str.length);
  }
}
