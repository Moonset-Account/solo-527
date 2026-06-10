import { AppError } from './errors';

export interface VariableContext {
  env?: Record<string, string>;
  collection?: Record<string, string>;
  globals?: Record<string, string>;
  extracted?: Record<string, unknown>;
  folder?: Record<string, string>;
}

export class VariableResolver {
  private context: VariableContext;

  constructor(context: VariableContext = {}) {
    this.context = context;
  }

  setContext(context: VariableContext): void {
    this.context = { ...this.context, ...context };
  }

  setExtracted(key: string, value: unknown): void {
    if (!this.context.extracted) {
      this.context.extracted = {};
    }
    this.context.extracted[key] = value;
  }

  getVariable(name: string): unknown {
    const parts = name.split('.');
    const root = parts[0];
    const rest = parts.slice(1).join('.');

    let value: unknown;
    switch (root) {
      case 'env':
        value = rest ? this.getNested(this.context.env || {}, rest) : this.context.env;
        break;
      case 'collection':
        value = rest ? this.getNested(this.context.collection || {}, rest) : this.context.collection;
        break;
      case 'global':
      case 'globals':
        value = rest ? this.getNested(this.context.globals || {}, rest) : this.context.globals;
        break;
      case 'extract':
      case 'extracted':
        value = rest ? this.getNested(this.context.extracted || {}, rest) : this.context.extracted;
        break;
      case 'folder':
        value = rest ? this.getNested(this.context.folder || {}, rest) : this.context.folder;
        break;
      default:
        value =
          this.context.extracted?.[name] ??
          this.context.folder?.[name] ??
          this.context.collection?.[name] ??
          this.context.env?.[name] ??
          this.context.globals?.[name];
    }

    return value;
  }

  private getNested(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  resolveString(input: string, strict: boolean = false): string {
    if (typeof input !== 'string') return input;

    const varPattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;
    const funcPattern = /\{\{\s*(\w+)\s*\(\s*([^)]*)\s*\)\s*\}\}/g;

    let result = input;

    result = result.replace(funcPattern, (_match, funcName, argsStr) => {
      const args = this.parseFunctionArgs(argsStr);
      return this.executeFunction(funcName, args, strict, input);
    });

    result = result.replace(varPattern, (_match, varName) => {
      const value = this.getVariable(varName);
      if (value === undefined || value === null) {
        if (strict) {
          throw new AppError(`未解析的变量: ${varName}`, {
            code: 'UNRESOLVED_VARIABLE',
            suggestions: [
              `在环境变量文件中定义 ${varName}`,
              `在 collection 的 variables 中定义 ${varName}`,
              `使用 --global ${varName}=value 命令行参数`,
              `检查变量名是否拼写正确`,
            ],
          });
        }
        return '';
      }
      return String(value);
    });

    return result;
  }

  private parseFunctionArgs(argsStr: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        quoteChar = '';
      } else if (char === ',' && !inQuote) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      args.push(current.trim());
    }

    return args.map(arg => {
      if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
        return arg.slice(1, -1);
      }
      return this.resolveString(arg);
    });
  }

  private executeFunction(funcName: string, args: string[], strict: boolean, _source: string): string {
    switch (funcName) {
      case 'timestamp': {
        const unit = args[0] || 'ms';
        const now = Date.now();
        return unit === 's' ? String(Math.floor(now / 1000)) : String(now);
      }
      case 'uuid': {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      case 'random': {
        const min = parseInt(args[0] || '0', 10);
        const max = parseInt(args[1] || '100', 10);
        return String(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      case 'randomString': {
        const length = parseInt(args[0] || '16', 10);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }
      case 'lowercase': {
        return (args[0] || '').toLowerCase();
      }
      case 'uppercase': {
        return (args[0] || '').toUpperCase();
      }
      case 'trim': {
        return (args[0] || '').trim();
      }
      case 'encodeURI': {
        return encodeURIComponent(args[0] || '');
      }
      case 'base64': {
        return Buffer.from(args[0] || '').toString('base64');
      }
      case 'env': {
        const value = process.env[args[0]];
        if (value === undefined && strict) {
          throw new AppError(`未定义的系统环境变量: ${args[0]}`, {
            code: 'MISSING_SYSTEM_ENV',
            suggestions: [`export ${args[0]}=value`],
          });
        }
        return value || '';
      }
      default:
        if (strict) {
          throw new AppError(`未知的函数: ${funcName}`, {
            code: 'UNKNOWN_FUNCTION',
            suggestions: ['支持的函数: timestamp, uuid, random, randomString, lowercase, uppercase, trim, encodeURI, base64, env'],
          });
        }
        return '';
    }
  }

  resolveObject<T>(input: T, strict: boolean = false): T {
    if (input === null || input === undefined) return input;

    if (typeof input === 'string') {
      return this.resolveString(input, strict) as unknown as T;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.resolveObject(item, strict)) as unknown as T;
    }

    if (typeof input === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        result[key] = this.resolveObject(value, strict);
      }
      return result as T;
    }

    return input;
  }
}
