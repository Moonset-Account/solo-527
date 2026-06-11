import { main } from './src/cli';

async function test() {
  console.log('=== Testing main function ===');
  try {
    const exitCode = await main(['parse', 'examples/work-notes.md', '--format', 'json']);
    console.log('\n=== Exit Code ===');
    console.log(exitCode);
  } catch (e: any) {
    console.error('Caught top-level error:', e.message);
    console.error('Stack:', e.stack);
  }
}

test().catch(e => {
  console.error('Test failed:', e);
  console.error(e.stack);
  process.exit(1);
});
