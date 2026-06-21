import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 完全模拟 @vitejs/plugin-vue 的解析方式
const pluginDir = __dirname + '/node_modules/@vitejs/plugin-vue/dist';
const _require = createRequire(pluginDir + '/index.mjs');

console.log('=== 完全模拟 @vitejs/plugin-vue 的解析 ===');
console.log('createRequire from:', pluginDir + '/index.mjs');
console.log();

function tryRequire(id, from) {
    try {
        const resolved = from ? _require(_require.resolve(id, { paths: [from] })) : _require(id);
        console.log(`✓ ${id} ${from ? '(from root)' : ''} -> OK, version: ${resolved.version || 'loaded'}`);
        return resolved;
    } catch (e) {
        console.log(`✗ ${id} ${from ? '(from root)' : ''} FAILED`);
        console.log(`  Message: ${e.message}`);
        if (e.cause) {
            console.log(`  Cause: ${e.cause.message}`);
        }
        return null;
    }
}

const root = __dirname;

// 先试 vue/package.json
console.log('Step 1: tryRequire("vue/package.json", root)');
const vueMeta = tryRequire("vue/package.json", root);
if (vueMeta && vueMeta.version.split(".")[0] >= 3) {
    console.log("\nStep 2: Vue 3.x detected, tryRequire('vue/compiler-sfc', root)");
    tryRequire("vue/compiler-sfc", root);
}

console.log("\n=== 直接测试 vue/compiler-sfc 入口 ===");
const sfcIndex = __dirname + '/node_modules/vue/compiler-sfc/index.js';
console.log('File:', sfcIndex);
console.log('Content:', require('fs').readFileSync(sfcIndex, 'utf8').trim());
console.log();

// 直接 require 这个入口
const sfcMod = _require(sfcIndex);
console.log('Direct require OK:', typeof sfcMod, 'version:', sfcMod.version);
