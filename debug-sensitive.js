'use strict';

const { maskSensitiveData, isSensitiveKey, findSensitiveKeys } = require('./src/sensitive');
const { parseFile } = require('./src/parser');
const path = require('path');

const FIXTURES_DIR = path.resolve(__dirname, 'tests/fixtures');
const base = parseFile(path.join(FIXTURES_DIR, 'simple-base.json'));
const overlay = parseFile(path.join(FIXTURES_DIR, 'simple-overlay.json'));

console.log('=== isSensitiveKey tests ===');
console.log('password:', isSensitiveKey('password'));
console.log('database.password:', isSensitiveKey('database.password'));
console.log('database.credentials.password:', isSensitiveKey('database.credentials.password'));
console.log('credentials:', isSensitiveKey('credentials'));
console.log('host:', isSensitiveKey('host'));
console.log('apiToken:', isSensitiveKey('apiToken'));
console.log('database.credentials.apiToken:', isSensitiveKey('database.credentials.apiToken'));

console.log('\n=== findSensitiveKeys in overlay ===');
const found = findSensitiveKeys(overlay.data);
console.log(JSON.stringify(found, null, 2));

console.log('\n=== Merging test ===');
const deepmerge = require('deepmerge');
const merged = deepmerge(base.data, overlay.data);
console.log('Merged database credentials:', JSON.stringify(merged.database.credentials, null, 2));

console.log('\n=== maskSensitiveData on merged ===');
const r = maskSensitiveData(merged, { maskType: 'default', autoDetect: true, explicitKeys: [], inPlace: false });
console.log('maskedKeys count:', r.maskedKeys.length);
console.log('maskedKeys details:', JSON.stringify(r.maskedKeys, null, 2));
console.log('masked data credentials:', JSON.stringify(r.data.database.credentials, null, 2));

console.log('\n=== Explicit keys test ===');
const merged2 = deepmerge(base.data, overlay.data);
const r2 = maskSensitiveData(merged2, {
  maskType: 'default',
  autoDetect: false,
  explicitKeys: ['database.credentials.apiToken', 'database.credentials.password'],
  inPlace: false
});
console.log('explicit maskedKeys count:', r2.maskedKeys.length);
console.log('explicit masked data credentials:', JSON.stringify(r2.data.database.credentials, null, 2));
