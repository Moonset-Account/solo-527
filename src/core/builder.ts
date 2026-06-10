import { v4 as uuidv4 } from 'uuid';
import {
  Collection,
  Environment,
  RequestDefinition,
  Folder,
  TestCase,
  AuthConfig,
  CLIOptions,
} from '../types';
import { VariableResolver, VariableContext } from '../utils/variables';
import { logger } from '../utils/logger';

export interface BuildOptions {
  collectionPath?: string;
  strictVariables?: boolean;
  cliOptions?: CLIOptions;
}

export class TestCaseBuilder {
  static buildTestCases(
    collection: Collection,
    environment?: Environment,
    options: BuildOptions = {}
  ): TestCase[] {
    const testCases: TestCase[] = [];
    const globals = options.cliOptions?.globals || {};

    const baseContext: VariableContext = {
      env: environment?.variables || {},
      collection: collection.variables || {},
      globals,
    };

    const baseResolver = new VariableResolver(baseContext);

    const baseAuth: AuthConfig = {
      type: 'none',
      ...collection.auth,
      ...environment?.auth,
    };
    const resolvedBaseAuth = baseResolver.resolveObject(baseAuth);

    const defaultTimeout = options.cliOptions?.timeout ?? collection.settings?.timeout ?? 30000;
    const defaultRetries = options.cliOptions?.retries ?? collection.settings?.retries ?? 0;
    const defaultRetryDelay = options.cliOptions?.retryDelay ?? collection.settings?.retryDelay ?? 1000;

    const globalHeaders = {
      ...collection.headers,
      ...environment?.headers,
    };

    const baseUrl = baseResolver.resolveString(
      environment?.baseUrl || collection.baseUrl || ''
    );

    const filter = options.cliOptions?.filter?.toLowerCase();
    const includeTags = options.cliOptions?.tags || [];
    const excludeTags = options.cliOptions?.excludeTags || [];

    const processRequest = (
      req: RequestDefinition,
      folderPath?: string,
      folderAuth?: Partial<AuthConfig>,
      folderHeaders?: Record<string, string>,
      folderVars?: Record<string, string>
    ) => {
      const fullName = folderPath ? `${folderPath} > ${req.name}` : req.name;

      if (filter && !fullName.toLowerCase().includes(filter)) {
        logger.verbose(`跳过用例 [${fullName}] 不匹配 --filter`);
        return;
      }

      const reqTags = req.tags || [];
      if (includeTags.length > 0 && !includeTags.some(t => reqTags.includes(t))) {
        logger.verbose(`跳过用例 [${fullName}] 不匹配 --tags`);
        return;
      }
      if (excludeTags.length > 0 && excludeTags.some(t => reqTags.includes(t))) {
        logger.verbose(`跳过用例 [${fullName}] 匹配 --exclude-tags`);
        return;
      }

      const localContext: VariableContext = {
        ...baseContext,
        folder: folderVars,
      };
      const resolver = new VariableResolver(localContext);

      let resolvedUrl = resolver.resolveString(req.url, options.strictVariables);
      if (baseUrl && !/^https?:\/\//i.test(resolvedUrl)) {
        resolvedUrl = baseUrl.replace(/\/$/, '') + '/' + resolvedUrl.replace(/^\//, '');
      }

      const mergedHeaders: Record<string, string> = {
        ...globalHeaders,
        ...folderHeaders,
        ...req.headers,
      };
      const resolvedHeaders = resolver.resolveObject(mergedHeaders, options.strictVariables);

      const resolvedQueryParams = resolver.resolveObject(req.queryParams || {}, options.strictVariables);

      const resolvedBody = req.body !== undefined
        ? resolver.resolveObject(req.body, options.strictVariables)
        : undefined;

      const mergedAuth: AuthConfig = {
        ...resolvedBaseAuth,
        ...folderAuth,
        ...req.auth,
      } as AuthConfig;
      const resolvedAuth = resolver.resolveObject(mergedAuth, options.strictVariables);

      const assertions = req.assertions ? resolver.resolveObject(req.assertions, false) : [];

      const testCase: TestCase = {
        id: req.id || uuidv4(),
        name: req.name,
        fullName,
        folder: folderPath,
        request: req,
        resolvedUrl,
        resolvedHeaders,
        resolvedQueryParams,
        resolvedBody,
        resolvedAuth,
        assertions,
        timeout: req.timeout ?? defaultTimeout,
        retries: req.retries ?? defaultRetries,
        retryDelay: req.retryDelay ?? defaultRetryDelay,
        tags: reqTags,
        skip: req.skip || false,
        dependsOn: req.dependsOn || [],
        file: options.collectionPath,
      };

      testCases.push(testCase);
    };

    const processFolder = (
      folder: Folder,
      parentPath?: string,
      parentAuth?: Partial<AuthConfig>,
      parentHeaders?: Record<string, string>,
      parentVars?: Record<string, string>
    ) => {
      const folderPath = parentPath ? `${parentPath} > ${folder.name}` : folder.name;
      const mergedAuth: Partial<AuthConfig> = { ...parentAuth, ...folder.auth };
      const mergedHeaders: Record<string, string> = { ...parentHeaders, ...folder.headers };
      const mergedVars: Record<string, string> = { ...parentVars, ...folder.variables };

      folder.requests.forEach(req =>
        processRequest(req, folderPath, mergedAuth, mergedHeaders, mergedVars)
      );

      folder.folders?.forEach(f =>
        processFolder(f, folderPath, mergedAuth, mergedHeaders, mergedVars)
      );
    };

    (collection.requests || []).forEach(req => processRequest(req));
    (collection.folders || []).forEach(f => processFolder(f));

    logger.info(`构建了 ${testCases.length} 个测试用例`);
    return testCases;
  }
}
