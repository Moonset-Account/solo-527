'use strict';

const readline = require('readline');

function askQuestion(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
      terminal: true
    });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirmDangerous({ operation, description, affected, examples = [], dryRun = false, autoConfirm = false } = {}) {
  const result = {
    confirmed: false,
    dryRun,
    count: Array.isArray(affected) ? affected.length : (typeof affected === 'number' ? affected : 0)
  };

  if (dryRun) {
    printPreview(operation, description, affected, examples, true);
    result.confirmed = false;
    return result;
  }

  if (autoConfirm) {
    printPreview(operation, description, affected, examples, false);
    process.stderr.write('\nℹ  使用 --yes 自动确认，继续执行...\n\n');
    result.confirmed = true;
    return result;
  }

  if (!process.stdin.isTTY) {
    printPreview(operation, description, affected, examples, false);
    process.stderr.write('\nℹ  非交互终端，默认拒绝危险操作。使用 --yes 强制执行或 --dry-run 预览。\n\n');
    result.confirmed = false;
    return result;
  }

  printPreview(operation, description, affected, examples, false);

  const answer = await askQuestion('\n确认继续执行？(输入 YES 确认，其他取消): ');
  result.confirmed = answer === 'YES';

  if (!result.confirmed) {
    process.stderr.write('\n已取消操作。\n');
  }

  return result;
}

function printPreview(operation, description, affected, examples, isDryRun) {
  const stream = process.stderr;
  const bar = '═'.repeat(60);
  stream.write('\n');
  stream.write(`\x1b[1;33m${bar}\n`);
  stream.write(`  ⚠  危险操作预览: ${operation}\n`);
  stream.write(`${bar}\x1b[0m\n\n`);

  if (description) stream.write(`  ${description}\n\n`);

  const count = Array.isArray(affected) ? affected.length : (typeof affected === 'number' ? affected : 0);
  if (count > 0) {
    stream.write(`  影响范围: \x1b[1;31m${count}\x1b[0m 个项目\n`);
    if (Array.isArray(affected) && affected.length > 0) {
      const preview = affected.slice(0, 10);
      stream.write('\n  示例:\n');
      for (const item of preview) {
        const line = typeof item === 'string' ? item : (item.path || item.file || JSON.stringify(item));
        stream.write(`    - ${line}\n`);
      }
      if (affected.length > 10) {
        stream.write(`    ... 以及另外 ${affected.length - 10} 个\n`);
      }
    }
    stream.write('\n');
  }

  if (examples && examples.length) {
    stream.write('  详细信息:\n');
    for (const ex of examples.slice(0, 5)) {
      stream.write(`    • ${ex}\n`);
    }
    if (examples.length > 5) stream.write(`    ... 等 ${examples.length} 项\n`);
    stream.write('\n');
  }

  if (isDryRun) {
    stream.write('  \x1b[36m这是预览模式 (--dry-run)，未执行任何实际操作。\x1b[0m\n');
  }

  stream.write(`\x1b[1;33m${bar}\x1b[0m\n`);
}

module.exports = {
  confirmDangerous,
  askQuestion
};
