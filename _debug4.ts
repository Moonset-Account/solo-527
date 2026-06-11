const PLACEHOLDER_REGEX = /\$\{([^}]+)\}/g;

function interpolate(str, vars) {
  return str.replace(PLACEHOLDER_REGEX, (match, key) => {
    const k = key.trim();
    if (k in vars) {
      return String(vars[k]);
    }
    return match;
  });
}

const vars = { REGEX_PATTERN: 'user_\\d+' };
console.log('vars value:', JSON.stringify(vars.REGEX_PATTERN));
console.log('vars length:', vars.REGEX_PATTERN.length);
const input = '${REGEX_PATTERN}';
const result = interpolate(input, vars);
console.log('result:', JSON.stringify(result));
console.log('result length:', result.length);
console.log('result chars:', [...result].map(c => c.charCodeAt(0).toString(16)));
