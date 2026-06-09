const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname);
const BOOT = path.join(ROOT, 'src/scripts/boot.js');
const SH_PATH = path.join(ROOT, 'start.sh');

process.stdout.write('\n\x1b[1m🚀 社区热线诉求分拨助手\x1b[0m\n');
process.stdout.write('─'.repeat(44) + '\n');

// Step 1: 自动修复 start.sh 权限位（让交付说明中的 ./start.sh 从现在起可用）
let shFixed = false;
try {
  if (fs.existsSync(SH_PATH)) {
    const stat = fs.statSync(SH_PATH);
    const mode = stat.mode & 0o777;
    if (mode !== 0o755) {
      fs.chmodSync(SH_PATH, 0o755);
      process.stdout.write(`\x1b[35m[权限修复]\x1b[0m start.sh: ${mode.toString(8)} → 755（下次可直接 ./start.sh 执行）\n`);
    } else {
      process.stdout.write(`\x1b[32m[权限 OK]\x1b[0m start.sh 已是 755（可直接 ./start.sh 执行）\n`);
    }
    shFixed = true;
  }
} catch (e) {
  process.stdout.write(`\x1b[33m[提示]\x1b[0m 无法设置 start.sh 权限（非致命，继续启动）: ${e.message}\n`);
}

// Step 2: 调用 boot.js 完整启动链
if (!fs.existsSync(BOOT)) {
  process.stderr.write(`\x1b[31m[致命错误]\x1b[0m 启动引导文件不存在: ${BOOT}\n`);
  process.exit(1);
}

process.stdout.write(`\x1b[36m[启动]\x1b[0m 转交 boot.js 执行完整启动流程...\n\n`);
require(BOOT);
