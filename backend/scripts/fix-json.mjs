import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  'src/controllers/purchaseOrders.js',
  'src/controllers/batches.js',
  'src/controllers/inventory.js',
];

function removeJsonStringify(code) {
  const result = [];
  let i = 0;
  while (i < code.length) {
    const idx = code.indexOf('JSON.stringify(', i);
    if (idx === -1) {
      result.push(code.slice(i));
      break;
    }
    result.push(code.slice(i, idx));
    let depth = 1;
    let j = idx + 'JSON.stringify('.length;
    while (j < code.length && depth > 0) {
      if (code[j] === '(') depth++;
      else if (code[j] === ')') depth--;
      j++;
    }
    result.push(code.slice(idx + 'JSON.stringify('.length, j - 1));
    i = j;
  }
  return result.join('');
}

let totalFixed = 0;
for (const file of files) {
  const fullPath = path.resolve(__dirname, '..', file);
  const original = fs.readFileSync(fullPath, 'utf8');
  const countBefore = (original.match(/JSON\.stringify/g) || []).length;
  const fixed = removeJsonStringify(original);
  const countAfter = (fixed.match(/JSON\.stringify/g) || []).length;
  if (original !== fixed) {
    fs.writeFileSync(fullPath, fixed, 'utf8');
    console.log(`✅ ${file}: 替换了 ${countBefore - countAfter} 处`);
    totalFixed += countBefore - countAfter;
  } else {
    console.log(`⏭️  ${file}: 无需修改`);
  }
}
console.log(`\n总共替换了 ${totalFixed} 处 JSON.stringify`);
