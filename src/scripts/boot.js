require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const envPath = path.join(ROOT, '.env');
const envExample = path.join(ROOT, '.env.example');
const nodeMod = path.join(ROOT, 'node_modules');
const pkg = require(path.join(ROOT, 'package.json'));

function log(color, tag, msg) {
  const c = { info: '\x1b[36m', ok: '\x1b[32m', warn: '\x1b[33m', err: '\x1b[31m', dim: '\x1b[2m', reset: '\x1b[0m' };
  console.log(`${c[color] || ''}[${tag}]${c.reset} ${msg}`);
}

(async () => {
  console.log('\n\x1b[1m🚀 社区热线诉求分拨助手 · 启动引导\x1b[0m');
  console.log('='.repeat(60));

  // 1. .env 检测
  if (!fs.existsSync(envPath)) {
    log('warn', '配置', '.env 不存在，从 .env.example 复制模板');
    fs.copyFileSync(envExample, envPath);
    log('warn', '配置', `请编辑 ${envPath}，填入：`);
    console.log('         · OPENAI_API_KEY = 你的 OpenAI API Key');
    console.log('         · JWT_SECRET     = 任意随机字符串（JWT签名）');
    log('err', '配置', '首次启动失败：请先编辑 .env 后重新执行 npm run boot');
    process.exit(1);
  }
  log('ok', '配置', '.env 已就绪');

  // 校验 API Key 占位符
  const envTxt = fs.readFileSync(envPath, 'utf8');
  if (/sk-xxx-your-openai-key-here/.test(envTxt)) {
    log('warn', '配置', '检测到 OPENAI_API_KEY 使用占位值，请替换为真实Key');
    console.log('       （不配置时，需要OpenAI接口的功能会报错，但规则层验收仍可运行）');
  }

  // 2. 依赖检测
  if (!fs.existsSync(nodeMod) || !fs.existsSync(path.join(nodeMod, '.package-lock.json')) && !fs.existsSync(path.join(nodeMod, 'express'))) {
    log('info', '依赖', 'node_modules 不存在，开始安装...');
    await new Promise((resolve, reject) => {
      const cp = spawn('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], {
        cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32',
      });
      cp.on('exit', code => code === 0 ? resolve() : reject(new Error(`npm install exit ${code}`)));
    });
    log('ok', '依赖', '安装完成');
  } else {
    log('ok', '依赖', `node_modules 已就绪（${Object.keys(pkg.dependencies).length} 个运行时依赖）`);
  }

  // 3. 设置 start.sh 可执行位（可选，不影响启动）
  try {
    const sh = path.join(ROOT, 'start.sh');
    if (fs.existsSync(sh)) { fs.chmodSync(sh, 0o755); log('dim', '权限', 'start.sh 已设置为可执行（755）'); }
  } catch (e) { log('dim', '权限', '（忽略）start.sh 权限设置失败：' + e.message); }

  // 4. 初始化数据库（首次自动建表+默认用户）
  try {
    const db = require(path.join(ROOT, 'src/utils/database'));
    db.getDb && db.getDb();
    const auth = require(path.join(ROOT, 'src/services/authService'));
    await (auth.initDefaultUsers && auth.initDefaultUsers());
    log('ok', '数据库', 'SQLite 表+默认用户 初始化完成');
  } catch (e) { log('warn', '数据库', '初始化警告：' + e.message); }

  // 5. 启动 dev server
  const mode = process.argv[2] === 'prod' ? 'start' : 'dev';
  log(mode === 'start' ? 'warn' : 'info', '启动', `执行 npm run ${mode} ...`);
  console.log('─'.repeat(60) + '\n');
  const cp = spawn('npm', ['run', mode], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  cp.on('SIGINT', () => process.exit(0));
  cp.on('exit', code => process.exit(code || 0));
})();
