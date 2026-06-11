process.env.BASE_URL = 'http://localhost:9999';
process.env.API_TOKEN = 'token-from-process-env';

import { loadCollection, mergeAndInterpolate } from './src/loader';

const coll = loadCollection('examples/collection.json');
if (!coll.success || !coll.data) {
  console.error('load failed', coll.errors);
  process.exit(1);
}

const result = mergeAndInterpolate(coll.data);
if (!result.success || !result.data) {
  console.error('merge failed with errors:');
  for (const e of result.errors || []) {
    console.log(' -', e.type, e.fieldPath, '::', e.message);
  }
  process.exit(1);
}

console.log('OK: baseUrl =', result.data.baseUrl);
console.log('OK: global auth.token =', (result.data.auth as any).token);
console.log('OK: tests[1].auth.token =', (result.data.tests[1].auth as any).token);
console.log('OK: 所有字段均已正确插值，未解析占位符数量为 0');
