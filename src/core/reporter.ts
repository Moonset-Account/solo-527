import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { IndexReport, Anomaly, AnomalyType, CliOptions, IndexEntry } from '../types';
import { formatDuration, formatFileSize } from '../utils/fileScanner';

const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  [AnomalyType.MISSING_TRANSCRIPT]: '缺少转写',
  [AnomalyType.AGENT_MISMATCH]: '坐席不匹配',
  [AnomalyType.DURATION_ABNORMAL]: '时长异常',
  [AnomalyType.DUPLICATE_SAMPLE]: '重复样本',
  [AnomalyType.AGENT_NOT_SCHEDULED]: '坐席未排班',
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  reset: '\x1b[0m',
};

export class Reporter {
  private options: CliOptions;

  constructor(options: CliOptions) {
    this.options = options;
  }

  public printConsoleReport(report: IndexReport): void {
    if (this.options.json) {
      this.printJsonReport(report);
      return;
    }

    this.printSummary(report);
    this.printAnomalySummary(report);
    this.printAnomalyDetails(report);
    this.printIndexSummary(report);
  }

  private printJsonReport(report: IndexReport): void {
    const jsonOutput = JSON.stringify(report, null, 2);
    console.log(jsonOutput);
  }

  private printSummary(report: IndexReport): void {
    const { summary } = report;

    console.log('\n' + '='.repeat(70));
    console.log('📊 客服通话录音索引报告');
    console.log('='.repeat(70));
    console.log(`生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`日期范围: ${summary.dateRange.start || '-'} 至 ${summary.dateRange.end || '-'}`);
    console.log(`涉及坐席: ${summary.agents.length > 0 ? summary.agents.join(', ') : '-'}`);
    console.log('-'.repeat(70));
    console.log(`录音文件总数: ${summary.totalAudio}`);
    console.log(`转写文件总数: ${summary.totalTranscript}`);
    console.log(`有效样本数: ${summary.validSamples}`);
    console.log(`异常总数: ${summary.totalAnomalies}`);
    console.log('='.repeat(70) + '\n');
  }

  private printAnomalySummary(report: IndexReport): void {
    const { summary } = report;

    console.log('📋 异常类型统计:');
    console.log('-'.repeat(50));

    for (const [type, count] of Object.entries(summary.anomaliesByType)) {
      const label = ANOMALY_TYPE_LABELS[type as AnomalyType] || type;
      const bar = '█'.repeat(Math.min(Math.round((count / Math.max(summary.totalAnomalies, 1)) * 30), 30));
      console.log(`${label.padEnd(12)}: ${bar} ${count}`);
    }
    console.log('');
  }

  private printAnomalyDetails(report: IndexReport): void {
    const { anomalies } = report;

    if (anomalies.length === 0) {
      console.log('✅ 未检测到任何异常\n');
      return;
    }

    console.log('🔍 异常详情:');
    console.log('-'.repeat(70));

    const groupedByType = this.groupAnomaliesByType(anomalies);

    for (const [type, typeAnomalies] of Object.entries(groupedByType)) {
      const label = ANOMALY_TYPE_LABELS[type as AnomalyType] || type;
      console.log(`\n【${label}】共 ${typeAnomalies.length} 项:`);

      for (const anomaly of typeAnomalies) {
        const color = SEVERITY_COLORS[anomaly.severity] || '';
        const reset = SEVERITY_COLORS.reset;
        const severityLabel = SEVERITY_LABELS[anomaly.severity] || anomaly.severity;

        console.log(`  ${color}[${severityLabel}]${reset} ${anomaly.message}`);
        if (anomaly.details.audioFile) {
          console.log(`     文件: ${anomaly.details.audioFile}`);
        }
      }
    }
    console.log('');
  }

  private printIndexSummary(report: IndexReport): void {
    const { indices } = report;

    console.log('📑 索引清单 (按坐席+日期分组):');
    console.log('-'.repeat(70));

    const groupedByAgentAndDate = this.groupIndicesByAgentAndDate(indices);

    for (const [agentKey, dateGroups] of Object.entries(groupedByAgentAndDate)) {
      const [agentId, agentName] = agentKey.split('|');
      console.log(`\n👤 坐席: ${agentId} (${agentName})`);

      for (const [date, entries] of Object.entries(dateGroups)) {
        const validCount = entries.filter(e => e.isValid).length;
        const totalCount = entries.length;

        console.log(`  📅 ${date}: 共 ${totalCount} 条, 有效 ${validCount} 条`);

        for (const entry of entries) {
          const status = entry.isValid ? '✅' : '❌';
          const anomaliesInfo = entry.anomalies.length > 0
            ? ` (${entry.anomalies.map(a => ANOMALY_TYPE_LABELS[a.type]).join(', ')})`
            : '';

          console.log(`     ${status} ${entry.callTime} | 时长: ${formatDuration(entry.duration)} | ${entry.audioId}${anomaliesInfo}`);
        }
      }
    }
    console.log('');
  }

  public async writeReportFiles(report: IndexReport): Promise<{ indexFile: string; anomalyFile: string; summaryFile: string }> {
    const { outputDir, dryRun } = this.options;
    const timestamp = dayjs().format('YYYYMMDD_HHmmss');

    const indexFile = path.join(outputDir, `index_${timestamp}.json`);
    const anomalyFile = path.join(outputDir, `anomalies_${timestamp}.json`);
    const summaryFile = path.join(outputDir, `input_summary_${timestamp}.json`);

    if (dryRun) {
      console.log('🔍 [Dry Run] 以下文件将被生成:');
      console.log(`   - ${indexFile}`);
      console.log(`   - ${anomalyFile}`);
      console.log(`   - ${summaryFile}`);
      return { indexFile, anomalyFile, summaryFile };
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(indexFile, JSON.stringify({
      generatedAt: report.inputSummary.generatedAt,
      summary: report.summary,
      indices: report.indices,
    }, null, 2));

    fs.writeFileSync(anomalyFile, JSON.stringify({
      generatedAt: report.inputSummary.generatedAt,
      summary: report.summary.anomaliesByType,
      anomalies: report.anomalies,
    }, null, 2));

    fs.writeFileSync(summaryFile, JSON.stringify(report.inputSummary, null, 2));

    console.log(`📄 报告文件已生成:`);
    console.log(`   - 索引文件: ${indexFile}`);
    console.log(`   - 异常清单: ${anomalyFile}`);
    console.log(`   - 输入摘要: ${summaryFile}`);

    return { indexFile, anomalyFile, summaryFile };
  }

  private groupAnomaliesByType(anomalies: Anomaly[]): Record<AnomalyType, Anomaly[]> {
    const groups: Partial<Record<AnomalyType, Anomaly[]>> = {};

    for (const anomaly of anomalies) {
      if (!groups[anomaly.type]) {
        groups[anomaly.type] = [];
      }
      groups[anomaly.type]!.push(anomaly);
    }

    return groups as Record<AnomalyType, Anomaly[]>;
  }

  private groupIndicesByAgentAndDate(indices: IndexEntry[]): Record<string, Record<string, IndexEntry[]>> {
    const groups: Record<string, Record<string, IndexEntry[]>> = {};

    for (const index of indices) {
      const agentKey = `${index.agentId}|${index.agentName}`;
      if (!groups[agentKey]) {
        groups[agentKey] = {};
      }
      if (!groups[agentKey][index.callDate]) {
        groups[agentKey][index.callDate] = [];
      }
      groups[agentKey][index.callDate].push(index);
    }

    return groups;
  }

  public printFilterInfo(): void {
    const { agent, date } = this.options;

    if (agent || date) {
      console.log('🔍 当前筛选条件:');
      if (agent) console.log(`   - 坐席: ${agent}`);
      if (date) console.log(`   - 日期: ${date}`);
      console.log('');
    }
  }
}
