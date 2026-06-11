import * as fs from 'fs';
import * as path from 'path';
import type { DeployEnvFlag, FlagValue } from '../types';
import { detectType, parseDateOrUndefined } from '../utils';

export interface DeployLoaderOptions {
  files?: string[];
  envPrefix?: string;
  envWhitelist?: string[];
  environments?: string[];
  loadProcessEnv?: boolean;
}

interface RawDeployEntry {
  value: FlagValue;
  environment?: string;
  cluster?: string;
  owner?: string;
  lastModified?: string;
}

type RawDeployConfig = Record<string, RawDeployEntry | FlagValue>;

export class DeployEnvLoader {
  private options: Required<DeployLoaderOptions>;

  constructor(options: DeployLoaderOptions) {
    this.options = {
      files: options.files || [],
      envPrefix: options.envPrefix || 'FF_',
      envWhitelist: options.envWhitelist || [],
      environments: options.environments || [],
      loadProcessEnv: options.loadProcessEnv ?? false,
    };
  }

  async load(): Promise<DeployEnvFlag[]> {
    const flags: DeployEnvFlag[] = [];

    for (const file of this.options.files) {
      const resolvedPath = path.resolve(file);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Deploy config file not found: ${resolvedPath}`);
      }
      const fileFlags = this.loadFile(resolvedPath);
      flags.push(...fileFlags);
    }

    if (this.options.loadProcessEnv) {
      const envFlags = this.loadFromProcessEnv();
      flags.push(...envFlags);
    }

    if (this.options.environments.length > 0) {
      return flags.filter(f => this.options.environments.includes(f.environment));
    }

    return flags;
  }

  private loadFile(filePath: string): DeployEnvFlag[] {
    const flags: DeployEnvFlag[] = [];
    const ext = path.extname(filePath).toLowerCase();
    let data: unknown;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      if (ext === '.json') {
        data = JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        data = this.parseYaml(content);
      } else if (ext === '.env' || ext === '.properties') {
        data = this.parseEnvFile(content);
      } else {
        try {
          data = JSON.parse(content);
        } catch {
          try {
            data = this.parseYaml(content);
          } catch {
            data = this.parseEnvFile(content);
          }
        }
      }
    } catch (err) {
      throw new Error(`Failed to parse deploy file ${filePath}: ${(err as Error).message}`);
    }

    const envFromFile = this.inferEnvironmentFromPath(filePath);
    const parsed = this.parseDeployData(data, envFromFile);

    for (const entry of parsed) {
      flags.push({
        key: entry.key,
        value: entry.value,
        type: detectType(entry.value),
        source: 'deploy_env',
        environment: entry.environment,
        cluster: entry.cluster,
        owner: entry.owner,
        lastModified: entry.lastModified,
      });
    }

    return flags;
  }

  private parseDeployData(data: unknown, defaultEnv: string): Array<{
    key: string;
    value: FlagValue;
    environment: string;
    cluster?: string;
    owner?: string;
    lastModified?: string;
  }> {
    const results: Array<{
      key: string;
      value: FlagValue;
      environment: string;
      cluster?: string;
      owner?: string;
      lastModified?: string;
    }> = [];

    if (!data || typeof data !== 'object') {
      return results;
    }

    const obj = data as Record<string, unknown>;

    if ('clusters' in obj && typeof obj.clusters === 'object') {
      const clusters = obj.clusters as Record<string, RawDeployConfig>;
      for (const [clusterName, clusterConfig] of Object.entries(clusters)) {
        if (clusterConfig && typeof clusterConfig === 'object') {
          const clusterFlags = this.parseFlatConfig(clusterConfig as RawDeployConfig, defaultEnv, clusterName);
          results.push(...clusterFlags);
        }
      }
      return results;
    }

    if ('environments' in obj && typeof obj.environments === 'object') {
      const envs = obj.environments as Record<string, RawDeployConfig>;
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
          const ec = envConfig as Record<string, unknown>;

          if ('clusters' in ec && typeof ec.clusters === 'object') {
            const clusters = ec.clusters as Record<string, RawDeployConfig>;
            for (const [clusterName, clusterConfig] of Object.entries(clusters)) {
              const clusterFlags = this.parseFlatConfig(clusterConfig, envName, clusterName);
              results.push(...clusterFlags);
            }
          } else {
            const envFlags = this.parseFlatConfig(ec as RawDeployConfig, envName);
            results.push(...envFlags);
          }
        }
      }
      return results;
    }

    return this.parseFlatConfig(obj as RawDeployConfig, defaultEnv);
  }

  private parseFlatConfig(config: RawDeployConfig, environment: string, cluster?: string): Array<{
    key: string;
    value: FlagValue;
    environment: string;
    cluster?: string;
    owner?: string;
    lastModified?: string;
  }> {
    const results: Array<{
      key: string;
      value: FlagValue;
      environment: string;
      cluster?: string;
      owner?: string;
      lastModified?: string;
    }> = [];

    for (const [key, value] of Object.entries(config)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const entry = value as Record<string, unknown>;
        if ('value' in entry) {
          const rawEntry = value as RawDeployEntry;
          results.push({
            key,
            value: rawEntry.value ?? null,
            environment: rawEntry.environment || environment,
            cluster: rawEntry.cluster || cluster,
            owner: rawEntry.owner,
            lastModified: parseDateOrUndefined(rawEntry.lastModified),
          });
        } else {
          this.flattenNested(entry, key, results, environment, cluster);
        }
      } else {
        results.push({
          key,
          value: value as FlagValue,
          environment,
          cluster,
        });
      }
    }

    return results;
  }

  private flattenNested(
    obj: Record<string, unknown>,
    prefix: string,
    results: Array<{
      key: string;
      value: FlagValue;
      environment: string;
      cluster?: string;
      owner?: string;
      lastModified?: string;
    }>,
    environment: string,
    cluster?: string
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = `${prefix}.${key}`;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const entry = value as Record<string, unknown>;
        if ('value' in entry) {
          const rawEntry = value as RawDeployEntry;
          results.push({
            key: fullKey,
            value: rawEntry.value ?? null,
            environment: rawEntry.environment || environment,
            cluster: rawEntry.cluster || cluster,
            owner: rawEntry.owner,
            lastModified: parseDateOrUndefined(rawEntry.lastModified),
          });
        } else {
          this.flattenNested(entry, fullKey, results, environment, cluster);
        }
      } else {
        results.push({
          key: fullKey,
          value: value as FlagValue,
          environment,
          cluster,
        });
      }
    }
  }

  private loadFromProcessEnv(): DeployEnvFlag[] {
    const flags: DeployEnvFlag[] = [];
    const prefix = this.options.envPrefix;
    const whitelist = this.options.envWhitelist;

    for (const [key, rawValue] of Object.entries(process.env)) {
      if (rawValue === undefined) continue;
      const value: string = rawValue;
      let flagKey: string | null = null;

      if (prefix && key.startsWith(prefix)) {
        flagKey = key.slice(prefix.length).toLowerCase().replace(/_{2,}/g, '.').replace(/_/g, '.');
      } else if (whitelist.length > 0 && whitelist.includes(key)) {
        flagKey = key.toLowerCase();
      }

      if (flagKey) {
        flags.push({
          key: flagKey,
          value: this.parseEnvValue(value),
          type: detectType(this.parseEnvValue(value)),
          source: 'deploy_env',
          environment: process.env.NODE_ENV || 'development',
        });
      }
    }

    return flags;
  }

  private parseEnvValue(value: string): FlagValue {
    const trimmed = value.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return num;
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch {}
    }
    return trimmed;
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

    for (const line of lines) {
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

  private parseEnvFile(content: string): Record<string, FlagValue> {
    const result: Record<string, FlagValue> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;

      const key = trimmed.slice(0, eqIdx).trim().replace(/^export\s+/i, '');
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');

      result[key] = this.parseEnvValue(val);
    }

    return result;
  }
}
