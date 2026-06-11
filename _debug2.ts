const PLACEHOLDER_REGEX = /\$\{([^}]+)\}/g;

function interpolate(str, vars) {
  return str.replace(PLACEHOLDER_REGEX, (match, key) => {
    const k = key.trim();
    console.log('found match:', JSON.stringify(match), 'key:', JSON.stringify(k), 'in vars:', k in vars);
    if (k in vars) {
      return String(vars[k]);
    }
    return match;
  });
}

const vars = { ENV_NAME: '开发', USER_ID: '123', TOKEN: 'abc', INCLUDE: 'profile' };

const name = '测试 ${USER_ID}';
console.log('input name:', JSON.stringify(name));
console.log('chars:', [...name].map(c => c.charCodeAt(0).toString(16)));
console.log('result:', JSON.stringify(interpolate(name, vars)));
