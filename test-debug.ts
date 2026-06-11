import { parseArgs } from './src/cli-args';
import { parseFiles } from './src/parser';
import { deduplicateTodos, filterTodos, sortTodos } from './src/task';
import { formatJson } from './src/output';

async function test() {
  console.log('=== Test 1: parseArgs ===');
  const args = parseArgs(['parse', 'examples/work-notes.md', '--format', 'json']);
  console.log('args.tag:', args.tag);
  console.log('args.tag type:', typeof args.tag);
  console.log('args.tag is array:', Array.isArray(args.tag));
  console.log('args._:', args._);
  console.log('args.files:', args.files);

  console.log('\n=== Test 2: parseFiles ===');
  const result = await parseFiles(['examples/work-notes.md']);
  console.log('todos count:', result.todos.length);

  console.log('\n=== Test 3: deduplicateTodos ===');
  const { todos: uniqueTodos, duplicates } = deduplicateTodos(result.todos);
  console.log('unique:', uniqueTodos.length, 'duplicates:', duplicates.length);

  console.log('\n=== Test 4: filterTodos ===');
  try {
    const filtered = filterTodos(uniqueTodos, {
      from: args.from,
      tag: args.tag as string[] | undefined,
      due: args.due,
      project: args.project,
      status: args.status as any,
    });
    console.log('filtered count:', filtered.length);
  } catch (e: any) {
    console.error('filterTodos error:', e.message);
    console.error('stack:', e.stack);
  }

  console.log('\n=== Test 5: sortTodos ===');
  const sorted = sortTodos(uniqueTodos, 'dueDate');
  console.log('sorted count:', sorted.length);

  console.log('\n=== Test 6: formatJson ===');
  const json = formatJson(sorted.slice(0, 2), true);
  console.log(json);
}

test().catch(e => {
  console.error('Test failed:', e);
  console.error(e.stack);
  process.exit(1);
});
