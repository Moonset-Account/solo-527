import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Collection, Environment, RequestDefinition, Folder } from '../types';
import { PathUtils } from '../utils/path';
import { ConfigError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface LoadOptions {
  validate?: boolean;
  strictVariables?: boolean;
  globals?: Record<string, string>;
}

export class ConfigLoader {
  static loadCollection(filePath: string, options: LoadOptions = {}): Collection {
    const absPath = PathUtils.makeAbsolute(filePath);
    logger.debug(`加载集合文件: ${absPath}`);

    if (!PathUtils.exists(absPath)) {
      throw new ConfigError(`集合文件不存在: ${filePath}`, {
        code: 'COLLECTION_NOT_FOUND',
        suggestions: [
          '检查文件路径是否正确',
          '使用相对路径时需注意当前工作目录',
          '确认文件后缀为 .json, .yaml 或 .yml',
        ],
        location: { file: filePath },
      });
    }

    const ext = PathUtils.extname(absPath).toLowerCase();
    const content = this.readFile(absPath);
    let parsed: unknown;

    try {
      if (ext === '.json') {
        parsed = JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        parsed = yaml.load(content);
      } else {
        throw new ConfigError(`不支持的文件格式: ${ext}`, {
          code: 'UNSUPPORTED_FORMAT',
          suggestions: ['支持的格式: .json, .yaml, .yml'],
          location: { file: filePath },
        });
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        const lineMatch = err.message.match(/line\s+(\d+)/);
        const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
        throw new ConfigError(`解析失败: ${err.message}`, {
          code: 'PARSE_ERROR',
          cause: err as Error,
          suggestions: ['检查文件语法是否正确', '使用 JSON/YAML 校验工具'],
          location: { file: filePath, line },
        });
      }
      throw new ConfigError(`读取文件失败: ${(err as Error).message}`, {
        code: 'READ_ERROR',
        cause: err as Error,
        location: { file: filePath },
      });
    }

    const collection = parsed as Collection;
    collection.requests = collection.requests || [];
    collection.folders = collection.folders || [];

    this.enrichWithSourceInfo(collection, absPath);

    if (options.validate !== false) {
      this.validateCollection(collection, absPath);
    }

    return collection;
  }

  static loadEnvironment(filePath: string, options: LoadOptions = {}): Environment {
    const absPath = PathUtils.makeAbsolute(filePath);
    logger.debug(`加载环境文件: ${absPath}`);

    if (!PathUtils.exists(absPath)) {
      throw new ConfigError(`环境文件不存在: ${filePath}`, {
        code: 'ENV_NOT_FOUND',
        suggestions: ['检查环境文件路径是否正确', '确认环境文件已创建'],
        location: { file: filePath },
      });
    }

    const ext = PathUtils.extname(absPath).toLowerCase();
    const content = this.readFile(absPath);
    let parsed: unknown;

    try {
      if (ext === '.json') {
        parsed = JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        parsed = yaml.load(content);
      } else {
        parsed = this.parseDotEnv(content);
      }
    } catch (err) {
      throw new ConfigError(`解析环境文件失败: ${(err as Error).message}`, {
        code: 'ENV_PARSE_ERROR',
        cause: err as Error,
        location: { file: filePath },
      });
    }

    const env = parsed as Environment;
    env.variables = env.variables || {};

    if (options.validate !== false) {
      this.validateEnvironment(env, filePath);
    }

    return env;
  }

  private static parseDotEnv(content: string): Environment {
    const variables: Record<string, string> = {};
    const lines = content.split('\n');
    let name = '';
    let description = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) {
        if (line.startsWith('# name:')) {
          name = line.substring(7).trim();
        } else if (line.startsWith('# description:')) {
          description = line.substring(15).trim();
        }
        continue;
      }
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;

      const key = line.substring(0, eqIdx).trim();
      let value = line.substring(eqIdx + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      variables[key] = value;
    }

    return { name: name || 'dotenv', description, variables };
  }

  private static readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      throw new ConfigError(`读取文件失败: ${(err as Error).message}`, {
        code: 'FILE_READ_ERROR',
        cause: err as Error,
        location: { file: filePath },
      });
    }
  }

  private static enrichWithSourceInfo(collection: Collection, filePath: string): void {
    const processRequest = (req: RequestDefinition, _folder?: string) => {
      if (req.assertions) {
        req.assertions.forEach(assert => {
          if (!assert.errorLocation) {
            assert.errorLocation = { file: filePath, assertionName: assert.name };
          }
        });
      }
    };

    collection.requests.forEach(req => processRequest(req));

    const processFolder = (folder: Folder) => {
      folder.requests.forEach(req => processRequest(req, folder.name));
      folder.folders?.forEach(processFolder);
    };
    collection.folders?.forEach(processFolder);
  }

  private static validateCollection(collection: Collection, filePath: string): void {
    if (!collection.name) {
      throw new ValidationError('集合缺少必填字段: name', {
        code: 'MISSING_COLLECTION_NAME',
        suggestions: ['在 collection 文件根级别添加 name 字段'],
        location: { file: filePath },
      });
    }

    if (!collection.requests && !collection.folders) {
      throw new ValidationError('集合至少需要包含 requests 或 folders', {
        code: 'EMPTY_COLLECTION',
        suggestions: ['添加至少一个请求用例', '或至少一个包含请求的 folder'],
        location: { file: filePath },
      });
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const validateRequest = (req: RequestDefinition, prefix: string = '') => {
      const reqName = prefix + req.name;
      if (!req.name) {
        throw new ValidationError(`请求缺少必填字段: name`, {
          code: 'MISSING_REQUEST_NAME',
          suggestions: ['为每个请求添加 name 字段'],
          location: { file: filePath },
        });
      }
      if (!req.method) {
        throw new ValidationError(`请求 [${reqName}] 缺少 method 字段`, {
          code: 'MISSING_METHOD',
          suggestions: ['设置 method 为 GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS 之一'],
          location: { file: filePath },
        });
      }
      if (!validMethods.includes(req.method)) {
        throw new ValidationError(`请求 [${reqName}] 无效的 HTTP 方法: ${req.method}`, {
          code: 'INVALID_METHOD',
          suggestions: [`支持的方法: ${validMethods.join(', ')}`],
          location: { file: filePath },
        });
      }
      if (!req.url) {
        throw new ValidationError(`请求 [${reqName}] 缺少 url 字段`, {
          code: 'MISSING_URL',
          suggestions: ['添加完整的 API URL，或配合 baseUrl 使用相对路径'],
          location: { file: filePath },
        });
      }
    };

    collection.requests?.forEach(req => validateRequest(req));
    const validateFolder = (folder: Folder, prefix: string = '') => {
      const folderPrefix = prefix + folder.name + ' > ';
      folder.requests.forEach(req => validateRequest(req, folderPrefix));
      folder.folders?.forEach(f => validateFolder(f, folderPrefix));
    };
    collection.folders?.forEach(f => validateFolder(f));
  }

  private static validateEnvironment(env: Environment, filePath: string): void {
    if (!env.name) {
      throw new ValidationError('环境缺少必填字段: name', {
        code: 'MISSING_ENV_NAME',
        suggestions: ['在环境文件中添加 name 字段'],
        location: { file: filePath },
      });
    }
  }

  static flattenRequests(collection: Collection): Array<{ request: RequestDefinition; folderPath?: string }> {
    const result: Array<{ request: RequestDefinition; folderPath?: string }> = [];

    collection.requests?.forEach(req => {
      result.push({ request: req });
    });

    const processFolder = (folder: Folder, parentPath?: string) => {
      const folderPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
      folder.requests.forEach(req => {
        result.push({ request: req, folderPath });
      });
      folder.folders?.forEach(f => processFolder(f, folderPath));
    };
    collection.folders?.forEach(f => processFolder(f));

    return result;
  }
}
