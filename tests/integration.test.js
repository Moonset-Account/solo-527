'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const FIXTURES = path.resolve(__dirname, '..', 'fixtures');
const EXAMPLES = path.resolve(__dirname, '..', 'examples');

test('constants: 定义正确的退出码和类型', () => {
  const { EXIT_CODES, LINK_TYPES, RESULT_STATUS } = require('../src/utils/constants');
  assert.equal(EXIT_CODES.SUCCESS, 0);
  assert.equal(EXIT_CODES.BAD_LINKS_FOUND, 1);
  assert.equal(EXIT_CODES.CONFIG_ERROR, 2);
  assert.equal(EXIT_CODES.INVALID_ARGUMENTS, 3);
  assert.ok(LINK_TYPES.EXTERNAL_URL);
  assert.ok(RESULT_STATUS.BROKEN);
});

test('config: findConfigFile 可以找到指定配置文件', () => {
  const { findConfigFile } = require('../src/core/config');
  const yamlFile = path.join(EXAMPLES, '.mdlinkcheckerrc.yaml');
  const found = findConfigFile(__dirname, yamlFile);
  assert.equal(found, yamlFile);
});

test('config: 无效配置路径会抛出错误', () => {
  const { findConfigFile } = require('../src/core/config');
  assert.throws(() => {
    findConfigFile(__dirname, '/no/such/config.yaml');
  });
});

test('config: loadConfigFromFile 支持 YAML', () => {
  const { loadConfigFromFile } = require('../src/core/config');
  const yamlFile = path.join(EXAMPLES, '.mdlinkcheckerrc.yaml');
  const cfg = loadConfigFromFile(yamlFile);
  assert.equal(cfg.timeout, 5000);
  assert.deepEqual(cfg.fileExtensions, ['.md', '.markdown']);
});

test('config: loadConfigFromFile 支持 JSON', () => {
  const { loadConfigFromFile } = require('../src/core/config');
  const jsonFile = path.join(EXAMPLES, '.mdlinkcheckerrc.json');
  const cfg = loadConfigFromFile(jsonFile);
  assert.equal(cfg.timeout, 3000);
  assert.equal(cfg.checkExternal, false);
});

test('config: buildConfig 优先级 CLI > 文件 > 默认', () => {
  const { buildConfig } = require('../src/core/config');
  const yamlFile = path.join(EXAMPLES, '.mdlinkcheckerrc.yaml');
  const cfg = buildConfig({
    cliOptions: {
      configFile: yamlFile,
      timeout: 9999,
      format: 'json',
      root: FIXTURES
    }
  });
  assert.equal(cfg.timeout, 9999, 'CLI 应该覆盖文件中的 timeout=5000');
  assert.equal(cfg.format, 'json', 'CLI 应该覆盖默认 format');
  assert.deepEqual(cfg.ignoreFiles, ['CHANGELOG.md', '**/archive/**'], '文件配置的 ignoreFiles 应该保留');
  assert.equal(cfg.concurrency, 8, '文件配置的 concurrency=8 应该生效');
  assert.ok(cfg._configSources.file);
  assert.ok(cfg._configSources.cli);
});

test('parser: slugify 标题生成正确的 GitHub 风格锚点', () => {
  const { slugify } = require('../src/core/parser');
  assert.equal(slugify('Hello World'), 'hello-world');
  assert.equal(slugify('快速开始'), '快速开始');
  assert.equal(slugify(' A-B-C!!  '), 'a-b-c');
});

test('parser: extractAnchorTargets 找到 Markdown 标题和 HTML id', () => {
  const { extractAnchorTargets } = require('../src/core/parser');
  const content = `
# Hello World
## 快速开始
<h2 id="custom-id">Some HTML</h2>
<a name="legacy-anchor"></a>
`;
  const anchors = extractAnchorTargets(content);
  assert.ok(anchors.has('hello-world'));
  assert.ok(anchors.has('快速开始'));
  assert.ok(anchors.has('custom-id'));
  assert.ok(anchors.has('legacy-anchor'));
});

test('parser: parseMarkdownFile 提取多种链接类型', () => {
  const { parseMarkdownFile, classifyLink } = require('../src/core/parser');
  const content = `
[内部](./file.md)
[外链](https://example.com)
[锚点](#section)
![图片](./img.png)
<https://auto.link>
[参考][ref1]

[ref1]: ./other.md#锚
`;
  const { links } = parseMarkdownFile(content, '/tmp/a.md');
  assert.ok(links.length >= 6);
  const types = links.map(l => l.type);
  assert.ok(types.includes('internal_file'));
  assert.ok(types.includes('external_url'));
  assert.ok(types.includes('internal_anchor'));
  assert.ok(types.includes('image'));
});

test('ignore: IgnoreEngine 支持 glob 和正则', () => {
  const { IgnoreEngine } = require('../src/core/ignore');
  const engine = new IgnoreEngine({
    ignore: ['https://example.com/*', 'node_modules/**'],
    ignorePatterns: ['^https?://localhost'],
    ignoreFiles: ['CHANGELOG.md'],
    root: FIXTURES
  });
  assert.ok(engine.isLinkIgnored('https://example.com/page', null));
  assert.ok(engine.isLinkIgnored('https://localhost:3000/x', null));
  assert.ok(engine.isFileIgnored(path.join(FIXTURES, 'CHANGELOG.md')));
  assert.ok(!engine.isLinkIgnored('https://other.com/page', null));
});

test('scanner: collectMarkdownFiles 递归发现文件', () => {
  const { collectMarkdownFiles } = require('../src/core/scanner');
  const files = collectMarkdownFiles(FIXTURES, {
    recursive: true,
    fileExtensions: ['.md']
  });
  assert.ok(files.length >= 3, `至少有3个md文件，实际: ${files.length}`);
  assert.ok(files.some(f => f.endsWith('README.md')));
  assert.ok(files.some(f => f.endsWith('advanced.md')));
});

test('checker: 内部文件链接解析 - 正确的目标文件', () => {
  const { resolveInternalLink } = require('../src/core/checker');
  const result = resolveInternalLink(
    './install.md',
    path.join(FIXTURES, 'README.md'),
    FIXTURES
  );
  assert.equal(result.targetFile, path.join(FIXTURES, 'install.md'));
  assert.equal(result.anchor, '');
});

test('checker: 内部文件链接解析 - 坏文件返回 null', () => {
  const { resolveInternalLink } = require('../src/core/checker');
  const result = resolveInternalLink(
    './no-such.md',
    path.join(FIXTURES, 'README.md'),
    FIXTURES
  );
  assert.equal(result.targetFile, null);
});

test('checker: checkAnchor 有效/无效锚点', () => {
  const { checkAnchor } = require('../src/core/checker');
  const installMd = path.join(FIXTURES, 'install.md');
  assert.ok(checkAnchor(installMd, '安装指南').ok);
  assert.ok(checkAnchor(installMd, '配置').ok);
  const bad = checkAnchor(installMd, '完全不存在的标题');
  assert.equal(bad.ok, false);
  assert.ok(bad.reason.includes('不存在'));
});

test('end-to-end: 扫描 fixtures 目录返回正确的坏链数量', async () => {
  const { createStructuredLogger } = require('../src/utils/logger');
  const { buildConfig } = require('../src/core/config');
  const { runScan } = require('../src/core/scanner-runner');
  const { getExitCode } = require('../src/reporters');
  const { EXIT_CODES } = require('../src/utils/constants');

  const logger = createStructuredLogger({ level: 'silent' });
  const config = buildConfig({
    cliOptions: {
      root: FIXTURES,
      checkExternal: false,
      timeout: 1000,
      ignorePatterns: ['^https?://', '^mailto:'],
      ignoreFiles: ['CHANGELOG.md']
    },
    logger
  });

  const result = await runScan(config, logger);

  assert.ok(result.summary.fileCount >= 3);
  assert.ok(result.summary.brokenCount > 0, '预期存在坏链');
  assert.equal(getExitCode(result), EXIT_CODES.BAD_LINKS_FOUND);

  const broken = [];
  for (const f of result.files) {
    for (const l of f.links) {
      if (l.status === 'broken') broken.push(l);
    }
  }
  const types = new Set(broken.map(b => b.type));
  assert.ok(types.has('internal_file'), '存在坏的内部文件引用');
  assert.ok(types.has('internal_anchor') || broken.some(b => b.details?.reason?.includes('锚点')),
    '存在坏的锚点引用');
});

test('reporters: 三种格式都能渲染', () => {
  const { createStructuredLogger } = require('../src/utils/logger');
  const { buildConfig } = require('../src/core/config');
  const { runScan } = require('../src/core/scanner-runner');
  const { render } = require('../src/reporters');

  return (async () => {
    const logger = createStructuredLogger({ level: 'silent' });
    const config = buildConfig({
      cliOptions: {
        root: FIXTURES,
        checkExternal: false,
        ignorePatterns: ['^https?://', '^mailto:'],
        ignoreFiles: ['CHANGELOG.md']
      },
      logger
    });
    const result = await runScan(config, logger);

    const text = render(result, 'text', { useColor: false });
    assert.ok(text.includes('摘要') || text.includes('扫描'));

    const json = render(result, 'json');
    const parsed = JSON.parse(json);
    assert.ok(parsed.summary);
    assert.ok(Array.isArray(parsed.files));

    const md = render(result, 'markdown');
    assert.ok(md.startsWith('# '));
    assert.ok(md.includes('坏链') || md.includes('检查'));
  })();
});

test('exit code: 无坏链时返回 0', async () => {
  const { createStructuredLogger } = require('../src/utils/logger');
  const { buildConfig } = require('../src/core/config');
  const { runScan } = require('../src/core/scanner-runner');
  const { getExitCode } = require('../src/reporters');

  const singleFileRoot = fs.mkdtempSync('/tmp/mdlc-');
  fs.writeFileSync(path.join(singleFileRoot, 'only.md'), `# Only
[Self](#only)
`);
  const logger = createStructuredLogger({ level: 'silent' });
  const config = buildConfig({
    cliOptions: {
      root: singleFileRoot,
      checkExternal: false,
      checkImages: false
    },
    logger
  });
  const result = await runScan(config, logger);
  assert.equal(result.summary.brokenCount, 0);
  assert.equal(getExitCode(result), 0);

  fs.rmSync(singleFileRoot, { recursive: true });
});
