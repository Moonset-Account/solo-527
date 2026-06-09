const ts = require('typescript');
const fs = require('fs');

const src1 = fs.readFileSync('./src/config/GameConfig.ts', 'utf8');
const src2 = fs.readFileSync('./src/config/levels.ts', 'utf8');
let combined = src1 + '\n' + src2;
combined = combined.replace(/^import .*;?$/gm, '');
combined = combined.replace(/^export\s+/gm, '');
const result = ts.transpileModule(combined, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, skipLibCheck: true }
});
const mod = { exports: {} };
const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', result.outputText);
try {
  fn(mod.exports, require, mod, __filename, __dirname);
} catch (e) {
  console.error('编译执行出错:', e.message);
  process.exit(1);
}
const { LEVELS, validateLevelData, TileType } = mod.exports;

let ok = true;
for (const lvl of LEVELS) {
  const r = validateLevelData(lvl);
  console.log('关卡', lvl.id + '. ' + lvl.name);
  console.log('   valid:', r.valid, '| errors:', r.errors.length, '| warnings:', r.warnings.length);
  if (r.errors.length) { r.errors.forEach(e => console.log('    ❌', e)); ok = false; }
  if (r.warnings.length) r.warnings.forEach(w => console.log('    ⚠️', w));
  const cardInfo = lvl.indexCards.map(c =>
    `ic(${c.pos.x},${c.pos.y}) slot=${lvl.grid[c.pos.y][c.pos.x] === TileType.CARD_SLOT}`
  ).join('  ');
  const tarInfo = lvl.targetZones.map(t =>
    `tz(${t.pos.x},${t.pos.y}) zone=${lvl.grid[t.pos.y][t.pos.x] === TileType.TARGET_ZONE}`
  ).join('  ');
  const exits = [];
  for (let r = 0; r < lvl.grid.length; r++) {
    for (let c = 0; c < lvl.grid[0].length; c++) {
      if (lvl.grid[r][c] === TileType.EXIT) exits.push(`${c},${r}`);
    }
  }
  console.log('   索引卡:', cardInfo || '（无）');
  console.log('   目标区:', tarInfo || '（无）');
  console.log('   出口格:', exits.join(', ') || '❌ 无');
  console.log('');
}
console.log(ok ? '✅ 所有 5 关通过严格校验！' : '❌ 校验存在错误需要修复');
process.exit(ok ? 0 : 1);
