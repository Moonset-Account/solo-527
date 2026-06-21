import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 模拟 @vitejs/plugin-vue 的解析逻辑
const pluginDir = __dirname + '/node_modules/@vitejs/plugin-vue/dist';
const _require = createRequire(pluginDir + '/index.mjs');

console.log('Plugin dir:', pluginDir);
console.log('---');

// 测试解析
function tryResolve(id, from) {
    try {
        const resolved = from ? _require.resolve(id, { paths: [from] }) : _require.resolve(id);
        console.log(`✓ ${id} -> ${resolved}`);
        return true;
    } catch (e) {
        console.log(`✗ ${id} FAILED: ${e.message.split('\n')[0]}`);
        return false;
    }
}

const root = __dirname;
console.log('Try resolve from root:', root);
console.log('---');

tryResolve('vue/package.json', root);
tryResolve('vue/compiler-sfc', root);
tryResolve('@vue/compiler-sfc', root);

console.log('---');
console.log('Try without root:');
tryResolve('vue/package.json');
tryResolve('vue/compiler-sfc');
tryResolve('@vue/compiler-sfc');

console.log('---');
console.log('Checking exports of vue/package.json:');
const vuePkg = JSON.parse(require('fs').readFileSync(__dirname + '/node_modules/vue/package.json', 'utf8'));
console.log('Vue version:', vuePkg.version);
console.log('Vue exports ./compiler-sfc:', vuePkg.exports?.['./compiler-sfc'] ? 'YES' : 'NO');
if (vuePkg.exports?.['./compiler-sfc']) {
    console.log('  ->', typeof vuePkg.exports['./compiler-sfc'] === 'string' 
        ? vuePkg.exports['./compiler-sfc'] 
        : JSON.stringify(vuePkg.exports['./compiler-sfc'], null, 2));
}
