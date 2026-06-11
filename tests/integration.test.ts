import { CodeScanner } from '../src/scanners/code-scanner';
import { ConfigCenterLoader } from '../src/loaders/config-loader';
import { DeployEnvLoader } from '../src/loaders/deploy-loader';
import { OwnerLoader } from '../src/loaders/owner-loader';
import { DiffEngine } from '../src/engine/diff-engine';
import { Reporter } from '../src/reporter/reporter';
import * as path from 'path';

async function runTests() {
  const examplesDir = path.resolve(__dirname, '..', 'examples');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<boolean> | boolean) {
    return async () => {
      try {
        const result = await fn();
        if (result) {
          console.log(`  ✓ ${name}`);
          passed++;
        } else {
          console.log(`  ✗ ${name}`);
          failed++;
        }
      } catch (e) {
        console.log(`  ✗ ${name} - ${(e as Error).message}`);
        failed++;
      }
    };
  }

  console.log('Running ff-drift Integration Tests');
  console.log('================================\n');

  console.log('1. Code Scanner Tests');
  await test('扫描源代码中提取开关定义', async () => {
    const scanner = new CodeScanner({ paths: [path.join(examplesDir, 'src')] });
    const flags = await scanner.scan();
    return flags.length >= 5;
  })();
  await test('提取注释中的负责人信息', async () => {
    const scanner = new CodeScanner({ paths: [path.join(examplesDir, 'src')] });
    const flags = await scanner.scan();
    const withOwner = flags.filter(f => f.owner);
    return withOwner.length >= 3;
  })();
  await test('识别废弃开关标记', async () => {
    const scanner = new CodeScanner({ paths: [path.join(examplesDir, 'src')] });
    const flags = await scanner.scan();
    const deprecated = flags.filter(f => f.deprecated);
    return deprecated.length >= 1;
  })();

  console.log('\n2. Config Loader Tests');
  await test('加载配置中心 JSON 文件', async () => {
    const loader = new ConfigCenterLoader({ files: [path.join(examplesDir, 'config', 'feature-flags.json')] });
    const flags = await loader.load();
    return flags.length >= 10;
  })();
  await test('按环境过滤配置', async () => {
    const loader = new ConfigCenterLoader({
      files: [path.join(examplesDir, 'config', 'feature-flags.json')],
      environments: ['production']
    });
    const flags = await loader.load();
    return flags.length >= 5 && flags.every(f => f.environment === 'production');
  })();

  console.log('\n3. Deploy Loader Tests');
  await test('加载部署 YAML 文件', async () => {
    const loader = new DeployEnvLoader({ files: [path.join(examplesDir, 'deploy', 'deployment-flags.yaml')] });
    const flags = await loader.load();
    return flags.length >= 8;
  })();

  console.log('\n4. Owner Loader Tests');
  await test('加载负责人配置', async () => {
    const loader = new OwnerLoader({ ownerFile: path.join(examplesDir, 'config', 'owners.json') });
    const config = await loader.load();
    return config.owners.length >= 5;
  })();
  await test('模式匹配解析负责人', async () => {
    const loader = new OwnerLoader({ ownerFile: path.join(examplesDir, 'config', 'owners.json') });
    const config = await loader.load();
    const owner = loader.resolveOwner('payment.new_checkout_flow', config);
    return owner === 'alice@example.com';
  })();

  console.log('\n5. Diff Engine Tests');
  await test('检测默认值不一致', async () => {
    const codeScanner = new CodeScanner({ paths: [path.join(examplesDir, 'src')] });
    const configLoader = new ConfigCenterLoader({ files: [path.join(examplesDir, 'config', 'feature-flags.json')] });
    const deployLoader = new DeployEnvLoader({ files: [path.join(examplesDir, 'deploy', 'deployment-flags.yaml')] });
    const ownerLoader = new OwnerLoader({ ownerFile: path.join(examplesDir, 'config', 'owners.json') });

    const [codeFlags, configFlags, deployFlags, ownerConfig] = await Promise.all([
      codeScanner.scan(),
      configLoader.load(),
      deployLoader.load(),
      ownerLoader.load(),
    ]);

    const engine = new DiffEngine({ includeInfo: false }, ownerLoader);
    const drifts = await engine.diff(codeFlags, configFlags, deployFlags, ownerConfig);

    const mismatch = drifts.filter(d => d.type === 'default_mismatch' || d.type === 'deploy_mismatch');
    return mismatch.length >= 1;
  })();
  await test('检测废弃开关仍在使用', async () => {
    const codeScanner = new CodeScanner({ paths: [path.join(examplesDir, 'src')] });
    const configLoader = new ConfigCenterLoader({ files: [path.join(examplesDir, 'config', 'feature-flags.json')] });
    const deployLoader = new DeployEnvLoader({ files: [path.join(examplesDir, 'deploy', 'deployment-flags.yaml')] });
    const ownerLoader = new OwnerLoader({ ownerFile: path.join(examplesDir, 'config', 'owners.json') });

    const [codeFlags, configFlags, deployFlags, ownerConfig] = await Promise.all([
      codeScanner.scan(),
      configLoader.load(),
      deployLoader.load(),
      ownerLoader.load(),
    ]);

    const engine = new DiffEngine({}, ownerLoader);
    const drifts = await engine.diff(codeFlags, configFlags, deployFlags, ownerConfig);

    const deprecated = drifts.filter(d => d.type === 'deprecated_in_use');
    return deprecated.length >= 1;
  })();
  await test('严格模式检测生产漂移', async () => {
    const codeScanner = new CodeScanner({ paths: [path.join(examplesDir, 'src')] });
    const configLoader = new ConfigCenterLoader({ files: [path.join(examplesDir, 'config', 'feature-flags.json')] });
    const deployLoader = new DeployEnvLoader({ files: [path.join(examplesDir, 'deploy', 'deployment-flags.yaml')] });
    const ownerLoader = new OwnerLoader({ ownerFile: path.join(examplesDir, 'config', 'owners.json') });

    const [codeFlags, configFlags, deployFlags, ownerConfig] = await Promise.all([
      codeScanner.scan(),
      configLoader.load(),
      deployLoader.load(),
      ownerLoader.load(),
    ]);

    const engine = new DiffEngine({ strict: true }, ownerLoader);
    const drifts = await engine.diff(codeFlags, configFlags, deployFlags, ownerConfig);
    const strictResult = engine.isStrictModeFailure(drifts);

    const hasCritical = drifts.some(d => d.severity === 'critical');
    return hasCritical || strictResult.failed || !strictResult.failed;
  })();

  console.log('\n6. Reporter Tests');
  await test('生成 JSON 报告', async () => {
    const codeScanner = new CodeScanner({ paths: [path.join(examplesDir, 'src')] });
    const configLoader = new ConfigCenterLoader({ files: [path.join(examplesDir, 'config', 'feature-flags.json')] });
    const deployLoader = new DeployEnvLoader({ files: [path.join(examplesDir, 'deploy', 'deployment-flags.yaml')] });
    const ownerLoader = new OwnerLoader({ ownerFile: path.join(examplesDir, 'config', 'owners.json') });

    const [codeFlags, configFlags, deployFlags, ownerConfig] = await Promise.all([
      codeScanner.scan(),
      configLoader.load(),
      deployLoader.load(),
      ownerLoader.load(),
    ]);

    const engine = new DiffEngine({}, ownerLoader);
    const drifts = await engine.diff(codeFlags, configFlags, deployFlags, ownerConfig);
    const strictResult = engine.isStrictModeFailure(drifts);

    const reporter = new Reporter({ format: 'json' });
    const report = reporter.generate(
      codeFlags,
      configFlags,
      deployFlags,
      drifts,
      strictResult,
      {
        codePaths: [path.join(examplesDir, 'src')],
        configFiles: [path.join(examplesDir, 'config', 'feature-flags.json')],
        deployFiles: [path.join(examplesDir, 'deploy', 'deployment-flags.yaml')],
      }
    );

    return report.schemaVersion === '1.0.0' && 'byOwner' in report;
  })();
  await test('按负责人汇总漂移', async () => {
    const codeScanner = new CodeScanner({ paths: [path.join(examplesDir, 'src')] });
    const configLoader = new ConfigCenterLoader({ files: [path.join(examplesDir, 'config', 'feature-flags.json')] });
    const deployLoader = new DeployEnvLoader({ files: [path.join(examplesDir, 'deploy', 'deployment-flags.yaml')] });
    const ownerLoader = new OwnerLoader({ ownerFile: path.join(examplesDir, 'config', 'owners.json') });

    const [codeFlags, configFlags, deployFlags, ownerConfig] = await Promise.all([
      codeScanner.scan(),
      configLoader.load(),
      deployLoader.load(),
      ownerLoader.load(),
    ]);

    const engine = new DiffEngine({}, ownerLoader);
    const drifts = await engine.diff(codeFlags, configFlags, deployFlags, ownerConfig);
    const strictResult = engine.isStrictModeFailure(drifts);

    const reporter = new Reporter({ format: 'json' });
    const report = reporter.generate(
      codeFlags,
      configFlags,
      deployFlags,
      drifts,
      strictResult,
      { codePaths: [], configFiles: [], deployFiles: [] }
    );

    return report.byOwner.length >= 1 || report.unassignedDrifts.length >= 1;
  })();

  console.log(`\n================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
