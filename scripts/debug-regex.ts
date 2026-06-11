import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '..', 'examples', 'src', 'app', 'feature-flags.ts');
const content = fs.readFileSync(filePath, 'utf-8');

const patterns = [
  /(feature[Ff]lag|get[Ff]lag|getBoolean|getString|getInt|getNumber|getObject)\s*\(\s*([^,]+?)(?:\s*,\s*([^)]+?))?\s*\)/g,
];

console.log('Content lines:');
content.split('\n').forEach((line, i) => {
  console.log(`  ${i + 1}: ${line}`);
});

console.log('\n--- Function call matches ---');
for (const pattern of patterns) {
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = pattern.exec(content)) !== null) {
    count++;
    console.log(`  Match ${count}:`);
    console.log(`    func: ${match[1]}`);
    console.log(`    keyArg: "${match[2]}"`);
    console.log(`    valueArg: "${match[3] || 'undefined'}"`);
    console.log(`    index: ${match.index}`);
  }
  console.log(`  Total: ${count} matches`);
}

console.log('\n--- Const matches ---');
const constPattern = /(?:const|let|var)\s+(FF_[A-Z0-9_]+|FEATURE_[A-Z0-9_]+|FLAG_[A-Z0-9_]+)\s*[:=]\s*['"]([^'"]+)['"]/g;
let constMatch: RegExpExecArray | null;
while ((constMatch = constPattern.exec(content)) !== null) {
  console.log(`  ${constMatch[1]} = "${constMatch[2]}"`);
}
