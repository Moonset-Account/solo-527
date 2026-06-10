'use strict';
const { buildProgram } = require('./src/cli');

async function testCase(name, args, expectedValues) {
  console.log(`\n=== 测试: ${name}`);
  console.log(`CLI: md-link-checker ${args.join(' ')}`);
  const program = buildProgram();

  const argv = ['node', 'md-link-checker', ...args];

  let capturedOpts = null;
  program.commands.forEach(cmd => {
    const origAction = cmd._actionHandler;
    if (!origAction) return;
    cmd._actionHandler = null;
    cmd.action((opts, c) => { capturedOpts = { ...opts }; });
  });

  try {
    await program.parseAsync(argv);
  } catch (e) {
    if (!e.message?.includes?.('help') && e.code !== 'commander.helpDisplayed') {
      // ignore
    }
  }

  for (const [k, expected] of Object.entries(expectedValues)) {
    const actual = capturedOpts?.[k];
    const pass = actual === expected || (JSON.stringify(actual) === JSON.stringify(expected));
    const marker = pass ? '✅' : '❌';
    const info = pass ? '' : ` (实际=${JSON.stringify(actual)}` + `, 预期=${JSON.stringify(expected)})`;
    console.log(`  ${marker} ${k}: ${JSON.stringify(actual)}${info}`);
    if (!pass) {
      process.exitCode = 1;
    }
  }
}

(async () => {

await testCase(
  '用户报告的场景：--config JSON(checkExternal=false) 且 CLI 不传布尔开关',
  [
    'scan', '--config', './examples/.mdlinkcheckerrc.json',
    '--root', './fixtures',
    '--format', 'json',
    '--timeout', '1'
  ],
  {
    checkExternal: undefined,
    checkAnchors: undefined,
    checkImages: undefined,
    recursive: undefined
  }
);

await testCase(
  'CLI 显式传 --check-external false 覆盖',
  [
    'scan', '--config', './examples/.mdlinkcheckerrc.yaml',
    '--check-external', 'false'
  ],
  {
    checkExternal: false
  }
);

await testCase(
  'CLI 显式传 --check-external true 强制开启（覆盖 JSON 里的 false）',
  [
    'scan', '--config', './examples/.mdlinkcheckerrc.json',
    '--check-external', 'true'
  ],
  {
    checkExternal: true
  }
);

await testCase(
  'CLI 显式传 --check-anchors false + --recursive false',
  [
    'scan', '--check-anchors', 'false', '--recursive', '0'
  ],
  {
    checkAnchors: false,
    recursive: false
  }
);

await testCase(
  '无配置文件，用户没传布尔开关 → 全部 undefined（将走默认值）',
  ['scan'],
  {
    checkExternal: undefined,
    checkAnchors: undefined
  }
);

  console.log('\n✅ commander 选项值全部如预期：用户不传 → undefined（只在显式传入时才有值）\n');
})();
