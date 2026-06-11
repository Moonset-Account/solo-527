import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { VERSION } from './errors.js';

export function parseArgs(argv: string[]) {
  return yargs(hideBin(['node', 'note2task', ...argv]))
    .scriptName('note2task')
    .usage('$0 <command> [options] <files...>')
    .version(VERSION)
    .help('help')
    .alias('help', 'h')
    .option('format', {
      alias: 'f',
      describe: '输出格式',
      choices: ['table', 'json', 'csv'],
      default: 'table',
    })
    .option('from', {
      describe: '起始日期 (YYYY-MM-DD)，仅显示该日期及之后的任务',
      type: 'string',
    })
    .option('tag', {
      describe: '按标签筛选，可多次指定',
      type: 'array',
      alias: 't',
    })
    .option('due', {
      describe: '按截止日期筛选 (today/tomorrow/this-week/overdue/upcoming/YYYY-MM-DD)',
      type: 'string',
    })
    .option('project', {
      describe: '按项目名筛选',
      type: 'string',
      alias: 'p',
    })
    .option('status', {
      describe: '按状态筛选',
      choices: ['pending', 'done', 'all'],
      default: 'all',
    })
    .option('export', {
      describe: '导出结果到文件',
      type: 'string',
      alias: 'o',
    })
    .option('report', {
      describe: '输出机器可读报告到指定文件',
      type: 'string',
    })
    .option('concurrency', {
      describe: '并发处理的文件数',
      type: 'number',
      default: 4,
    })
    .option('retries', {
      describe: '失败重试次数',
      type: 'number',
      default: 3,
    })
    .option('verbose', {
      describe: '输出详细信息',
      type: 'boolean',
      alias: 'v',
      default: false,
    })
    .option('quiet', {
      describe: '静默模式，仅输出错误',
      type: 'boolean',
      alias: 'q',
      default: false,
    })
    .command(
      'parse [files..]',
      '解析 Markdown 笔记中的待办事项',
      (yargs) => {
        return yargs.positional('files', {
          describe: 'Markdown 文件路径，支持 glob 模式',
          type: 'string',
        });
      }
    )
    .command(
      'preview [files..]',
      '预览同步变更（新增/更新/删除）',
      (yargs) => {
        return yargs.positional('files', {
          describe: '源 Markdown 文件路径',
          type: 'string',
        });
      }
    )
    .command(
      'report [files..]',
      '生成机器可读报告',
      (yargs) => {
        return yargs.positional('files', {
          describe: 'Markdown 文件路径',
          type: 'string',
        });
      }
    )
    .example('$0 parse notes/*.md', '解析 notes 目录下所有 Markdown 文件')
    .example('$0 parse --tag work --due today notes/*.md', '筛选今天截止且包含 work 标签的任务')
    .example('$0 parse --format json --export tasks.json notes/*.md', '导出为 JSON 文件')
    .example('$0 preview --export existing.json notes/*.md', '预览与现有任务的差异')
    .example('$0 report --report report.json notes/*.md', '生成机器可读报告')
    .epilog(
      '退出码:\n' +
      '  0 - 成功\n' +
      '  1 - 通用错误\n' +
      '  2 - 无效参数\n' +
      '  3 - 解析错误\n' +
      '  4 - 无输入文件\n' +
      '  5 - 导出失败\n' +
      '  6 - 同步失败'
    )
    .strict()
    .parse();
}
