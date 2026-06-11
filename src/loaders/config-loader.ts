import * as fs from 'fs';
import * as path from 'path';
import type { ConfigCenterFlag, FlagValue } from '../types';
import { detectType, parseDateOrUndefined } from '../utils';

export interface ConfigLoaderOptions {
  files: string[];
  environments?: string[];
}

interface RawConfigEntry {
  value: FlagValue;
  owner?: string;
  description?: string;
  deprecated?: boolean;
  deprecatedReason?: string;
  updatedAt?: string;
  updatedBy?: string;
  environment?: string;
}

type RawConfig = Record<string, RawConfigEntry | FlagValue>;

export class ConfigCenterLoader {
  private options: ConfigLoaderOptions;

  constructor(options: ConfigLoaderOptions) {
    this.options = options;
  }

  async load(): Promise<ConfigCenterFlag[]> {
    const flags: ConfigCenterFlag[] = [];

    for (const file of this.options.files) {
      const resolvedPath = path.resolve(file);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Config file not found: ${resolvedPath}`);
      }

      const fileFlags = this.loadFile(resolvedPath);
      flags.push(...fileFlags);
    }

    if (this.options.environments && this.options.environments.length > 0) {
      return flags.filter(f => this.options.environments!.includes(f.environment));
    }

    return flags;
  }

  private loadFile(filePath: string): ConfigCenterFlag[] {
    const flags: ConfigCenterFlag[] = [];
    const ext = path.extname(filePath).toLowerCase();
    let data: unknown;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      if (ext === '.json') {
        data = JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        data = this.parseYaml(content);
      } else if (ext === '.toml') {
        data = this.parseToml(content);
      } else if (ext === '.env' || ext === '.properties') {
        data = this.parseProperties(content);
      } else {
        try {
          data = JSON.parse(content);
        } catch {
          try {
            data = this.parseYaml(content);
          } catch {
            data = this.parseProperties(content);
          }
        }
      }
    } catch (err) {
      throw new Error(`Failed to parse config file ${filePath}: ${(err as Error).message}`);
    }

    const envFromFile = this.inferEnvironmentFromPath(filePath);
    const parsed = this.parseConfigData(data, envFromFile);

    for (const entry of parsed) {
      flags.push({
        key: entry.key,
        value: entry.value,
        type: detectType(entry.value),
        source: 'config_center',
        environment: entry.environment,
        owner: entry.owner,
        description: entry.description,
        deprecated: entry.deprecated,
        deprecatedReason: entry.deprecatedReason,
        updatedAt: entry.updatedAt,
        updatedBy: entry.updatedBy,
        lastModified: entry.updatedAt,
      });
    }

    return flags;
  }

  private parseConfigData(data: unknown, defaultEnv: string): Array<{
    key: string;
    value: FlagValue;
    environment: string;
    owner?: string;
    description?: string;
    deprecated?: boolean;
    deprecatedReason?: string;
    updatedAt?: string;
    updatedBy?: string;
  }> {
    const results: Array<{
      key: string;
      value: FlagValue;
      environment: string;
      owner?: string;
      description?: string;
      deprecated?: boolean;
      deprecatedReason?: string;
      updatedAt?: string;
      updatedBy?: string;
    }> = [];

    if (!data || typeof data !== 'object') {
      return results;
    }

    const obj = data as Record<string, unknown>;

    if ('environments' in obj && typeof obj.environments === 'object') {
      const envs = obj.environments as Record<string, RawConfig>;
      for (const [envName, envConfig] of Object.entries(envs)) {
        const envFlags = this.parseFlatConfig(envConfig, envName);
        results.push(...envFlags);
      }
      return results;
    }

    const hasEnvKeys = Object.keys(obj).every(k =>
      k.toLowerCase().match(/^(dev|development|staging|prod|production|test|qa|uat)$/)
    );

    if (hasEnvKeys && Object.keys(obj).length > 0) {
      for (const [envName, envConfig] of Object.entries(obj)) {
        if (envConfig && typeof envConfig === 'object') {
          const envFlags = this.parseFlatConfig(envConfig as RawConfig, envName);
          results.push(...envFlags);
        }
      }
      return results;
    }

    return this.parseFlatConfig(obj as RawConfig, defaultEnv);
  }

  private parseFlatConfig(config: RawConfig, environment: string): Array<{
    key: string;
    value: FlagValue;
    environment: string;
    owner?: string;
    description?: string;
    deprecated?: boolean;
    deprecatedReason?: string;
    updatedAt?: string;
    updatedBy?: string;
  }> {
    const results: Array<{
      key: string;
      value: FlagValue;
      environment: string;
      owner?: string;
      description?: string;
      deprecated?: boolean;
      deprecatedReason?: string;
      updatedAt?: string;
      updatedBy?: string;
    }> = [];

    this.flattenConfig(config, '', results, environment);
    return results;
  }

  private flattenConfig(
    obj: RawConfig,
    prefix: string,
    results: Array<{
      key: string;
      value: FlagValue;
      environment: string;
      owner?: string;
      description?: string;
      deprecated?: boolean;
      deprecatedReason?: string;
      updatedAt?: string;
      updatedBy?: string;
    }>,
    environment: string
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const entry = value as Record<string, unknown>;
        const hasValueKey = 'value' in entry;

        if (hasValueKey || 'owner' in entry || 'description' in entry || 'deprecated' in entry) {
          const rawEntry = value as RawConfigEntry;
          results.push({
            key: fullKey,
            value: rawEntry.value ?? null,
            environment: rawEntry.environment || environment,
            owner: rawEntry.owner,
            description: rawEntry.description,
            deprecated: rawEntry.deprecated,
            deprecatedReason: rawEntry.deprecatedReason,
            updatedAt: parseDateOrUndefined(rawEntry.updatedAt),
            updatedBy: rawEntry.updatedBy,
          });
        } else {
          this.flattenConfig(value as RawConfig, fullKey, results, environment);
        }
      } else {
        results.push({
          key: fullKey,
          value: value as FlagValue,
          environment,
        });
      }
    }
  }

  private inferEnvironmentFromPath(filePath: string): string {
    const base = path.basename(filePath).toLowerCase();
    const envPatterns: Array<[RegExp, string]> = [
      [/production|prod/, 'production'],
      [/staging/, 'staging'],
      [/development|dev/, 'development'],
      [/testing|test/, 'test'],
      [/qa/, 'qa'],
      [/uat/, 'uat'],
    ];

    for (const [pattern, env] of envPatterns) {
      if (pattern.test(base)) return env;
    }

    const dir = path.dirname(filePath).toLowerCase();
    for (const [pattern, env] of envPatterns) {
      if (pattern.test(dir)) return env;
    }

    return 'default';
  }

  private parseYaml(content: string): unknown {
    const lines = content.split('\n');
    const result: Record<string, unknown> = {};
    const stack: Array<{ indent: number; obj: Record<string, unknown> }> = [{ indent: -1, obj: result }];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) continue;

      const indent = line.match(/^\s*/)![0].length;
      const trimmed = line.trim();

      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (trimmed.startsWith('- ')) {
        const val = trimmed.slice(2).trim();
        const parentKey = Object.keys(parent).pop();
        if (parentKey) {
          const arr = (parent[parentKey] as unknown[]) || [];
          arr.push(this.parseYamlScalar(val));
          parent[parentKey] = arr;
        }
        continue;
      }

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;

      const key = trimmed.slice(0, colonIdx).trim();
      const valStr = trimmed.slice(colonIdx + 1).trim();

      if (valStr === '' || valStr === '|' || valStr === '>') {
        const newObj: Record<string, unknown> = {};
        parent[key] = newObj;
        stack.push({ indent, obj: newObj });
      } else {
        parent[key] = this.parseYamlScalar(valStr.replace(/^['"]|['"]$/g, ''));
      }
    }

    return result;
  }

  private parseYamlScalar(val: string): unknown {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null' || val === '~') return null;
    const num = Number(val);
    if (!isNaN(num) && val !== '') return num;
    return val;
  }

  private parseToml(content: string): unknown {
    const result: Record<string, unknown> = {};
    let current = result;
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        const parts = sectionMatch[1].split('.');
        current = result;
        for (const part of parts) {
          if (!(part in current)) {
            current[part] = {};
          }
          current = current[part] as Record<string, unknown>;
        }
        continue;
      }

      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;

      const key = trimmed.slice(0, eqIdx).trim();
      const valStr = trimmed.slice(eqIdx + 1).trim();

      try {
        current[key] = this.parseTomlValue(valStr);
      } catch {}
    }

    return result;
  }

  private parseTomlValue(val: string): unknown {
    if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        return JSON.parse(val);
      } catch {
        return val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      }
    }
    const num = Number(val);
    if (!isNaN(num) && val !== '') return num;
    return val;
  }

  private parseProperties(content: string): Record<string, FlagValue> {
    const result: Record<string, FlagValue> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;

      const eqIdx = trimmed.indexOf('=');
      const colIdx = trimmed.indexOf(':');
      const idx = eqIdx === -1 ? colIdx : (colIdx === -1 ? eqIdx : Math.min(eqIdx, colIdx));
      if (idx === -1) continue;

      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');

      if (val === 'true') result[key] = true;
      else if (val === 'false') result[key] = false;
      else if (val === 'null') result[key] = null;
      else {
        const num = Number(val);
        if (!isNaN(num) && val !== '') result[key] = num;
        else result[key] = val;
      }
    }

    return result;
  }
}
