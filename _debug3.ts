import { mergeAndInterpolate } from './src/loader';

const collection: any = {
  name: 'B', version: '1.0', baseUrl: 'http://x',
  tests: [{
    id: 't1', name: 'T', method: 'GET', url: '/',
    assertions: [
      { type: 'header', name: 'X-Tenant', value: '${EXPECTED_TENANT}' },
      { type: 'bodyRegex', pattern: '${REGEX_PATTERN}', flags: 'i' },
    ],
  }],
};
const env: any = { name: 'e', variables: { EXPECTED_TENANT: 'acme', REGEX_PATTERN: 'user_\\d+' } };

console.log('REGEX_PATTERN value in env.variables:', JSON.stringify(env.variables.REGEX_PATTERN));
console.log('REGEX_PATTERN length:', env.variables.REGEX_PATTERN.length);

const r = mergeAndInterpolate(collection, env);
console.log('success:', r.success);
if (r.success) {
  const pattern = (r.data!.tests[0].assertions as any[])[1].pattern;
  console.log('result pattern:', JSON.stringify(pattern));
  console.log('result pattern length:', pattern.length);
} else {
  console.log('errors:', JSON.stringify(r.errors, null, 2));
}
