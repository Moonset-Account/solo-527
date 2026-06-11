import { CodeScanner } from '../src/scanners/code-scanner';
import * as path from 'path';

async function debug() {
  const scanner = new CodeScanner({ paths: [path.join(__dirname, '..', 'examples', 'src')] });
  const flags = await scanner.scan();

  console.log('Total flags:', flags.length);
  console.log('\n--- Flags ---');
  for (const f of flags) {
    console.log(`  key: ${f.key}`);
    console.log(`    value: ${JSON.stringify(f.value)} (${f.type})`);
    console.log(`    owner: ${f.owner || 'none'}`);
    console.log(`    deprecated: ${!!f.deprecated}`);
    console.log(`    line: ${f.line}`);
    console.log(`    file: ${path.basename(f.file)}`);
    console.log();
  }
}

debug().catch(console.error);
