import pLimit from 'p-limit';
import {
  TestCase,
  TestCaseResult,
  TestRunReport,
  TestRunSummary,
  TestError,
  HttpResponseData,
  CLIOptions,
  AssertionResult,
} from '../types';
import { RequestExecutor } from './executor';
import { AssertionEngine } from './assertions';
import { logger } from '../utils/logger';
import { VariableResolver } from '../utils/variables';
import { JSONPath } from 'jsonpath-plus';
import { Collection, Environment } from '../types';

export interface RunnerOptions {
  parallel?: number;
  bail?: boolean;
  dryRun?: boolean;
  insecure?: boolean;
  followRedirects?: boolean;
}

export class TestRunner {
  private executor: RequestExecutor;
  private options: RunnerOptions;
  private variableResolver: VariableResolver;
  private extractStore: Record<string, unknown> = {};

  constructor(options: RunnerOptions = {}) {
    this.options = options;
    this.executor = new RequestExecutor({
      insecure: options.insecure,
      followRedirects: options.followRedirects,
    });
    this.variableResolver = new VariableResolver();
  }

  async run(
    testCases: TestCase[],
    collection: Collection,
    environment?: Environment,
    cliOptions?: CLIOptions
  ): Promise<TestRunReport> {
    const startedAt = new Date();
    const results: TestCaseResult[] = [];

    if (testCases.length === 0) {
      logger.warn('没有可执行的测试用例');
    }

    if (this.options.dryRun) {
      return this.runDryRun(testCases, collection, environment, cliOptions, startedAt);
    }

    const hasDependencies = testCases.some(tc => tc.dependsOn && tc.dependsOn.length > 0);
    const parallelLimit = hasDependencies ? 1 : (this.options.parallel || 1);
    const limit = pLimit(parallelLimit);

    if (parallelLimit > 1) {
      logger.info(`并行执行模式: ${parallelLimit} 个并发`);
    } else if (hasDependencies) {
      logger.info('检测到依赖关系，串行执行以保证顺序');
    }

    let bailTriggered = false;
    const completedNames = new Set<string>();

    const runTestCase = async (testCase: TestCase): Promise<TestCaseResult> => {
      if (bailTriggered) {
        return this.buildSkippedResult(testCase, 'BAIL_TRIGGERED');
      }

      if (testCase.skip) {
        logger.info(`⏭  跳过: ${testCase.fullName}`);
        return this.buildSkippedResult(testCase, 'SKIPPED');
      }

      if (testCase.dependsOn && testCase.dependsOn.length > 0) {
        const unresolvedDeps = testCase.dependsOn.filter(dep => !completedNames.has(dep));
        if (unresolvedDeps.length > 0) {
          logger.warn(`⏭  用例 [${testCase.fullName}] 依赖未完成: ${unresolvedDeps.join(', ')}，等待完成`);
          await this.waitForDependencies(testCase.dependsOn, completedNames, 10000);
        }
      }

      this.variableResolver.setContext({ extracted: this.extractStore });

      const testCaseStart = Date.now();

      try {
        this.applyExtractionsToTestCase(testCase);

        logger.info(`▶  执行: ${testCase.fullName}`);

        const { response, retries } = await this.executor.execute(testCase);
        const assertionResults = AssertionEngine.runAll(testCase.assertions, response);

        this.processExtractions(testCase, response);

        const allPassed = assertionResults.every(r => r.passed);
        const duration = Date.now() - testCaseStart;

        const result: TestCaseResult = {
          testCase,
          passed: allPassed,
          skipped: false,
          response,
          assertions: assertionResults,
          retries,
          duration,
        };

        completedNames.add(testCase.name);
        if (testCase.folder) {
          completedNames.add(`${testCase.folder} > ${testCase.name}`);
        }

        if (allPassed) {
          logger.success(`✅ 通过: ${testCase.fullName} (${duration}ms, 重试 ${retries} 次)`);
        } else {
          const failedCount = assertionResults.filter(r => !r.passed).length;
          logger.error(`❌ 失败: ${testCase.fullName} - ${failedCount} 个断言失败 (${duration}ms)`);
          assertionResults.filter(r => !r.passed).forEach(r => {
            logger.error(`   ↳ ${r.message}`);
          });

          if (this.options.bail) {
            bailTriggered = true;
          }
        }

        return result;

      } catch (err) {
        const duration = Date.now() - testCaseStart;
        const testError: TestError = {
          type: 'request',
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          location: testCase.file ? { file: testCase.file } : undefined,
        };

        logger.error(`💥 异常: ${testCase.fullName} - ${testError.message}`);

        const result: TestCaseResult = {
          testCase,
          passed: false,
          skipped: false,
          assertions: [],
          retries: testCase.retries,
          duration,
          error: testError,
        };

        if (this.options.bail) {
          bailTriggered = true;
        }

        return result;
      }
    };

    const sortedCases = this.sortByDependencies(testCases);

    const taskPromises = sortedCases.map(tc =>
      limit(() => runTestCase(tc))
    );

    results.push(...(await Promise.all(taskPromises)));

    const finishedAt = new Date();
    const summary = this.buildSummary(results, startedAt, finishedAt);

    return {
      collection: {
        name: collection.name,
        version: collection.version,
      },
      environment: environment ? { name: environment.name } : undefined,
      summary,
      results,
      cliOptions: cliOptions! as CLIOptions,
    };
  }

  private sortByDependencies(testCases: TestCase[]): TestCase[] {
    const nameToIndex = new Map<string, number>();
    testCases.forEach((tc, i) => {
      nameToIndex.set(tc.name, i);
      if (tc.folder) {
        nameToIndex.set(`${tc.folder} > ${tc.name}`, i);
      }
    });

    const visited = new Set<number>();
    const result: TestCase[] = [];
    const inStack = new Set<number>();

    const visit = (index: number): void => {
      if (inStack.has(index)) return;
      if (visited.has(index)) return;
      inStack.add(index);

      const tc = testCases[index];
      if (tc.dependsOn) {
        for (const dep of tc.dependsOn) {
          const depIdx = nameToIndex.get(dep);
          if (depIdx !== undefined) {
            visit(depIdx);
          }
        }
      }

      inStack.delete(index);
      visited.add(index);
      result.push(tc);
    };

    for (let i = 0; i < testCases.length; i++) {
      visit(i);
    }

    return result;
  }

  private async waitForDependencies(
    deps: string[],
    completed: Set<string>,
    timeout: number
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (deps.every(dep => completed.has(dep))) {
        return;
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }

  private applyExtractionsToTestCase(testCase: TestCase): void {
    const resolver = new VariableResolver({ extracted: this.extractStore });
    testCase.resolvedUrl = resolver.resolveString(testCase.resolvedUrl);
    testCase.resolvedHeaders = resolver.resolveObject(testCase.resolvedHeaders);
    testCase.resolvedQueryParams = resolver.resolveObject(testCase.resolvedQueryParams);
    testCase.resolvedBody = testCase.resolvedBody !== undefined
      ? resolver.resolveObject(testCase.resolvedBody)
      : undefined;
    if (testCase.resolvedAuth) {
      testCase.resolvedAuth = resolver.resolveObject(testCase.resolvedAuth);
    }
    testCase.assertions = resolver.resolveObject(testCase.assertions);
  }

  private processExtractions(testCase: TestCase, response: HttpResponseData): void {
    if (!testCase.request.extract) return;

    for (const [key, config] of Object.entries(testCase.request.extract)) {
      try {
        const extracted = JSONPath({ path: config.path, json: response.data as any }) as unknown as unknown[];
        const value = extracted.length === 1 ? extracted[0] : (extracted.length > 0 ? extracted : undefined);
        if (value !== undefined) {
          this.extractStore[key] = value;
          logger.debug(`提取变量 [${key}]: ${JSON.stringify(value)}`);
        }
      } catch (err) {
        logger.warn(`提取变量失败 [${key}]: ${(err as Error).message}`);
      }
    }
  }

  private runDryRun(
    testCases: TestCase[],
    collection: Collection,
    environment: Environment | undefined,
    cliOptions: CLIOptions | undefined,
    startedAt: Date
  ): TestRunReport {
    logger.info('📋 DRY RUN 模式 - 不发送实际请求');
    logger.newline();

    const results: TestCaseResult[] = testCases.map(tc => {
      logger.raw(`  ${tc.skip ? '⏭' : '▶'}  ${tc.fullName}`);
      logger.raw(`     ${tc.request.method} ${tc.resolvedUrl}`);
      if (tc.tags.length > 0) {
        logger.raw(`     Tags: ${tc.tags.join(', ')}`);
      }
      if (tc.resolvedHeaders && Object.keys(tc.resolvedHeaders).length > 0) {
        logger.raw(`     Headers:`);
        const maxKeyLen = Math.max(...Object.keys(tc.resolvedHeaders).map(k => k.length), 0);
        for (const [hKey, hVal] of Object.entries(tc.resolvedHeaders)) {
          const paddedKey = hKey.padEnd(maxKeyLen, ' ');
          logger.raw(`       ${paddedKey} = ${String(hVal)}`);
        }
      }
      if (tc.assertions.length > 0) {
        logger.raw(`     Assertions (${tc.assertions.length}):`);
        tc.assertions.forEach(a => {
          const expr = a.path ? `${a.path} ` : '';
          logger.raw(`       - [${a.type}] ${a.name}: ${expr}${a.operator} ${JSON.stringify(a.expected)}`);
        });
      }
      logger.raw('');

      return {
        testCase: tc,
        passed: true,
        skipped: tc.skip,
        assertions: tc.assertions.map(a => ({
          ...a,
          passed: true,
          message: 'DRY RUN',
        } as AssertionResult)),
        retries: 0,
        duration: 0,
      };
    });

    const finishedAt = new Date();
    const summary = this.buildSummary(results, startedAt, finishedAt);

    return {
      collection: { name: collection.name, version: collection.version },
      environment: environment ? { name: environment.name } : undefined,
      summary,
      results,
      cliOptions: cliOptions as unknown as CLIOptions,
    };
  }

  private buildSkippedResult(testCase: TestCase, reason: string): TestCaseResult {
    return {
      testCase,
      passed: false,
      skipped: true,
      assertions: [],
      retries: 0,
      duration: 0,
      error: {
        type: 'unknown',
        message: reason,
      } as TestError,
    };
  }

  private buildSummary(
    results: TestCaseResult[],
    startedAt: Date,
    finishedAt: Date
  ): TestRunSummary {
    const total = results.length;
    const passed = results.filter(r => r.passed && !r.skipped).length;
    const failed = results.filter(r => !r.passed && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;

    const totalAssertions = results.reduce((sum, r) => sum + r.assertions.length, 0);
    const passedAssertions = results.reduce(
      (sum, r) => sum + r.assertions.filter(a => (a as AssertionResult).passed).length,
      0
    );
    const failedAssertions = totalAssertions - passedAssertions;

    const duration = finishedAt.getTime() - startedAt.getTime();
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 100;

    return {
      total,
      passed,
      failed,
      skipped,
      totalAssertions,
      passedAssertions,
      failedAssertions,
      duration,
      startedAt,
      finishedAt,
      successRate,
    };
  }
}
