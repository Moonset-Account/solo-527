import { Command } from 'commander';
import { CliOptions } from '../types';

export function setupCli(): CliOptions {
  const program = new Command();

  program
    .name('call-index')
    .description('客服通话录音索引 CLI - 质检主管离线整理样本工具')
    .version('1.0.0')
    .requiredOption('-a, --audio-dir <path>', '录音文件目录路径')
    .requiredOption('-t, --transcript-dir <path>', '转写文本目录路径')
    .requiredOption('-s, --schedule-file <path>', '坐席排班表 CSV 文件路径')
    .option('-o, --output-dir <path>', '报告输出目录', './output')
    .option('--agent <agentId>', '按坐席ID筛选')
    .option('--date <YYYY-MM-DD>', '按日期筛选')
    .option('--json', '以 JSON 格式输出报告', false)
    .option('--dry-run', '试运行，不实际生成文件', false)
    .option('--min-duration <seconds>', '最小正常通话时长（秒）', '10')
    .option('--max-duration <seconds>', '最大正常通话时长（秒）', '3600');

  program.parse(process.argv);

  const options = program.opts();

  return {
    audioDir: options.audioDir,
    transcriptDir: options.transcriptDir,
    scheduleFile: options.scheduleFile,
    outputDir: options.outputDir,
    agent: options.agent,
    date: options.date,
    json: options.json,
    dryRun: options.dryRun,
    minDuration: parseInt(options.minDuration, 10),
    maxDuration: parseInt(options.maxDuration, 10),
  };
}

export function printHelp(): void {
  const program = new Command();
  program
    .name('call-index')
    .description('客服通话录音索引 CLI - 质检主管离线整理样本工具')
    .version('1.0.0')
    .option('-a, --audio-dir <path>', '录音文件目录路径')
    .option('-t, --transcript-dir <path>', '转写文本目录路径')
    .option('-s, --schedule-file <path>', '坐席排班表 CSV 文件路径')
    .option('-o, --output-dir <path>', '报告输出目录', './output')
    .option('--agent <agentId>', '按坐席ID筛选')
    .option('--date <YYYY-MM-DD>', '按日期筛选')
    .option('--json', '以 JSON 格式输出报告', false)
    .option('--dry-run', '试运行，不实际生成文件', false)
    .option('--min-duration <seconds>', '最小正常通话时长（秒）', '10')
    .option('--max-duration <seconds>', '最大正常通话时长（秒）', '3600');

  console.log(program.helpInformation());
}
