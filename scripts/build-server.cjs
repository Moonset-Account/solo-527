const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'api');
const distDir = path.join(rootDir, 'dist', 'server');

console.log('[server:build] Starting backend build...');

try {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  const tsConfigPath = path.join(rootDir, 'tsconfig.api.json');
  console.log(`[server:build] Running tsc -p ${path.basename(tsConfigPath)}`);

  execSync('npx tsc -p "' + tsConfigPath + '"', {
    cwd: rootDir,
    stdio: 'inherit',
  });

  const pkgOverride = {
    name: 'order-fulfillment-server',
    type: 'commonjs',
    main: 'main.js',
  };

  const pkgPath = path.join(distDir, 'package.json');
  fs.writeFileSync(pkgPath, JSON.stringify(pkgOverride, null, 2));
  console.log('[server:build] Wrote ' + path.relative(rootDir, pkgPath));

  const mainExists = fs.existsSync(path.join(distDir, 'main.js'));
  const moduleDir = path.join(distDir, 'modules');
  const hasModules = fs.existsSync(moduleDir) && fs.readdirSync(moduleDir).length > 0;

  console.log('');
  console.log('[server:build] Result:');
  console.log('  main.js ........ ' + (mainExists ? '✅ found' : '❌ MISSING'));
  console.log('  modules/ ..... ' + (hasModules ? '✅ ' + fs.readdirSync(moduleDir).length + ' dirs' : '❌ MISSING'));
  console.log('  package.json .. ✅ override written');
  console.log('');

  if (!mainExists) {
    const actualFiles = fs.existsSync(distDir) ? fs.readdirSync(distDir) : [];
    console.warn('[server:build] WARNING: dist/server contents:', actualFiles.join(', '));
    process.exit(1);
  }
} catch (err) {
  console.error('[server:build] FAILED:', err.message || String(err));
  process.exit(1);
}
