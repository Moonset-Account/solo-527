const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..', '..');
const SH_PATH = path.join(ROOT, 'start.sh');
const SH_CONTENT = `#!/bin/sh
# 社区热线诉求分拨助手 · 启动脚本
# 由 npm run boot 自动创建并设置为可执行
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "${DIR}/src/scripts/boot.js" "$@"
`;

try {
  fs.writeFileSync(SH_PATH, SH_CONTENT);
  fs.chmodSync(SH_PATH, 0o755);
  const stat = fs.statSync(SH_PATH);
  const mode = (stat.mode & 0o777).toString(8);
  process.stdout.write(
    `\x1b[32m[创建 start.sh]\x1b[0m ${SH_PATH}\n` +
    `         权限: ${mode}（${mode === '755' ? '✅ 可直接 ./start.sh 执行' : '请手动 chmod +x start.sh'}）\n`
  );
  process.exit(0);
} catch (e) {
  process.stderr.write(`\x1b[31m[致命错误]\x1b[0m 创建 start.sh 失败: ${e.message}\n`);
  process.exit(1);
}
