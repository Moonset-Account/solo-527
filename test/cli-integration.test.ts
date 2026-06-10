import { createTestFixtures } from './helpers/createFixtures';
import { tmpdir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const testDir = fs.mkdtempSync(path.join(tmpdir(), 'image-audit-cli-test-'));
console.log('📁 工作目录:', testDir);

const fixture = createTestFixtures(testDir);
const manifest = path.join(fixture.projectDir, 'manifest.json');

const config = {
  imageDir: fixture.imageDir,
  manifestPath: manifest,
  include: ['**/*.{png,jpg,jpeg,gif,webp,svg,avif,ico,bmp}'],
  ignore: ['**/node_modules/**', '**/.git/**'],
  sizeRules: {
    default: { maxWidth: 8192, maxHeight: 8192 },
    byPathGlob: {
      '**/icons/**': { maxWidth: 512, maxHeight: 512, allowedRatios: ['1:1'] },
      '**/banners/**': { minWidth: 1200, allowedRatios: ['16:9', '4:3'] },
      '**/avatars/**': { allowedRatios: ['1:1'], minWidth: 200 },
    },
  },
  dynamicRefs: [
    { pattern: 'tsx', glob: fixture.projectDir + '/**/*.{tsx,jsx,ts,js}' },
    { pattern: 'html', glob: fixture.projectDir + '/**/*.{html,vue}' },
    { pattern: 'css', glob: fixture.projectDir + '/**/*.{css,scss,less}' },
  ],
  baseDir: fixture.baseDir,
};
const configPath = path.join(testDir, 'audit.config.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ 配置文件已保存:', configPath);
console.log('');

const args = [
  'src/index.ts',
  fixture.imageDir,
  '--no-progress',
  '--color',
  '-c', configPath,
];
console.log('🚀 执行命令: npx tsx', args.join(' '));
console.log('');
const result = spawnSync('npx', ['tsx', ...args], {
  cwd: process.cwd(),
  encoding: 'utf-8',
  env: process.env,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

console.log('');
console.log('📊 进程退出码:', result.status);
console.log('');

// 测试 JSON 输出
console.log(''.padEnd(60, '═'));
console.log('🔍 测试 JSON 报告输出:');
console.log('');
const jsonArgs = [
  'src/index.ts',
  fixture.imageDir,
  '--no-progress',
  '--no-color',
  '-c', configPath,
  '-j',
  '-o', path.join(testDir, 'report.json'),
];
const jsonResult = spawnSync('npx', ['tsx', ...jsonArgs], {
  cwd: process.cwd(),
  encoding: 'utf-8',
  env: process.env,
});

try {
  const json = JSON.parse(jsonResult.stdout);
  console.log('JSON 解析成功 ✅');
  console.log('  - summary.totalImages:', json.summary.totalImages);
  console.log('  - summary.totalReferences:', json.summary.totalReferences);
  console.log('  - sizeViolations:', json.sizeViolations.length);
  console.log('  - duplicates:', json.duplicates.length);
  console.log('  - missingAlts:', json.missingAlts.length);
  console.log('  - unreferencedCandidates:', json.unreferencedCandidates.length);
  console.log('  - symlinkWarnings:', json.symlinkWarnings.length);
  console.log('  - errors:', json.errors.length);
  console.log('');
  const reportExists = fs.existsSync(path.join(testDir, 'report.json'));
  console.log('  - report.json 已写入:', reportExists ? '✅' : '❌');
} catch (e) {
  console.log('JSON 解析失败 ❌', (e as Error).message);
  console.log('stdout:', jsonResult.stdout.slice(0, 500));
}

// 测试删除计划生成
console.log('');
console.log(''.padEnd(60, '═'));
console.log('🗑️  测试删除计划生成:');
console.log('');
const planDir = path.join(testDir, 'output-plans');
const planArgs = [
  'src/index.ts',
  fixture.imageDir,
  '--no-progress',
  '--no-color',
  '-c', configPath,
  '--delete-plan', planDir,
  '--include-unreferenced',
  '--score-threshold', '0.7',
];
const planResult = spawnSync('npx', ['tsx', ...planArgs], {
  cwd: process.cwd(),
  encoding: 'utf-8',
  env: process.env,
});
if (planResult.stdout) process.stdout.write(planResult.stdout);
if (planResult.stderr) process.stderr.write(planResult.stderr);

const plans = fs.readdirSync(planDir || '.', { withFileTypes: true }).map(e => e.name);
console.log('');
console.log('计划输出目录内容:', plans);

process.exit(result.status ?? 0);
