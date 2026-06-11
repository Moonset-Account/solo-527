import { mergeAndInterpolate } from './src/loader';

const collection: any = {
  name: '${ENV_NAME} 测试集合',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000',
  tests: [{
    id: 't1',
    name: '测试 ${USER_ID}',
    method: 'GET',
    url: '/api/users/${USER_ID}',
    headers: { Authorization: 'Bearer ${TOKEN}' },
    queryParams: { include: '${INCLUDE}' },
    assertions: [{ type: 'statusCode', value: 200 }],
  }],
};
const env: any = {
  name: 'dev',
  variables: { ENV_NAME: '开发', USER_ID: '123', TOKEN: 'abc', INCLUDE: 'profile' },
};
const r = mergeAndInterpolate(collection, env);
console.log('success:', r.success);
if (!r.success) {
  console.log(JSON.stringify(r.errors, null, 2));
} else {
  console.log('name:', r.data!.name);
  console.log('url:', r.data!.tests[0].url);
}
