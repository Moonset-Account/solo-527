import { parseArgs } from './src/cli-args';
import { runParseCommand } from './src/cli';
import type { CLIArguments } from './src/types';

async function test() {
  console.log('=== Testing runParseCommand ===');
  const args = parseArgs(['parse', 'examples/work-notes.md', '--format', 'json']) as CLIArguments;
  console.log('Command:', args._[0]);
  console.log('Files:', args.files);

  try {
    const result = await runParseCommand(args);
    console.log('\n=== Result ===');
    console.log('exitCode:', result.exitCode);
    console.log('report.exitCode:', result.report.exitCode);
    console.log('report.success:', result.report.success);
    console.log('errors count:', result.report.errors.length);
    if (result.report.errors.length > 0) {
      console.log('first error:', JSON.stringify(result.report.errors[0], null, 2));
    }
    console.log('output length:', result.output.length);
    console.log('output preview:', result.output.substring(0, 200));
  } catch (e: any) {
    console.error('Caught error:', e.message);
    console.error('Stack:', e.stack);
  }
}

test().catch(e => {
  console.error('Test failed:', e);
  console.error(e.stack);
  process.exit(1);
});
