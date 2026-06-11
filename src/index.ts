#!/usr/bin/env node

import { setupCli } from './cli';
import { scanAudioDirectory, scanTranscriptDirectory } from './utils/fileScanner';
import { parseScheduleCsv } from './utils/csvParser';
import { IndexGenerator, GeneratorContext } from './core/indexGenerator';
import { Reporter } from './core/reporter';
import { AnomalyType } from './types';

function logDiagnostic(message: string): void {
  process.stderr.write(message + '\n');
}

async function main(): Promise<number> {
  try {
    const options = setupCli();
    const isJson = options.json;

    logDiagnostic('开始扫描输入文件...\n');

    const audioResult = scanAudioDirectory(options.audioDir);
    const transcriptResult = scanTranscriptDirectory(options.transcriptDir);
    const scheduleResult = parseScheduleCsv(options.scheduleFile);

    const allErrors = [
      ...audioResult.errors,
      ...transcriptResult.errors,
      ...scheduleResult.errors,
    ];

    if (allErrors.length > 0) {
      logDiagnostic('文件扫描警告:');
      for (const error of allErrors) {
        logDiagnostic(`   - ${error}`);
      }
      logDiagnostic('');
    }

    logDiagnostic(`扫描完成:`);
    logDiagnostic(`   - 录音文件: ${audioResult.data.length} 个`);
    logDiagnostic(`   - 转写文件: ${transcriptResult.data.length} 个`);
    logDiagnostic(`   - 排班记录: ${scheduleResult.data.length} 条\n`);

    if (audioResult.data.length === 0) {
      logDiagnostic('错误: 未找到任何录音文件');
      return 2;
    }

    const generatorContext: GeneratorContext = {
      audioFiles: audioResult.data,
      transcriptFiles: transcriptResult.data,
      scheduleEntries: scheduleResult.data,
      options,
    };

    const generator = new IndexGenerator(generatorContext);
    const report = generator.generate();

    const reporter = new Reporter(options);
    reporter.printFilterInfo();
    reporter.printConsoleReport(report);

    await reporter.writeReportFiles(report);

    const criticalCount = generator.getCriticalAnomalyCount(report);
    const hasCritical = generator.hasCriticalAnomalies(report);

    if (hasCritical) {
      logDiagnostic(`\n检测到 ${criticalCount} 个严重异常，处理完成但返回非零退出码`);
      return 1;
    }

    logDiagnostic('\n处理完成，未检测到严重异常');
    return 0;

  } catch (error) {
    process.stderr.write('\n程序执行出错:\n');
    if (error instanceof Error) {
      process.stderr.write(`   ${error.message}\n`);
      if (error.stack) process.stderr.write(error.stack + '\n');
    } else {
      process.stderr.write(`   ${String(error)}\n`);
    }
    return 3;
  }
}

main().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  process.stderr.write('未捕获的异常: ' + String(error) + '\n');
  process.exit(4);
});
