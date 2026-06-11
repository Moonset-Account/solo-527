import type {
  CodeDefaultFlag,
  ConfigCenterFlag,
  DeployEnvFlag,
  DriftItem,
  DriftType,
  OwnerConfig,
  FlagValue,
  FlagType,
  DriftSeverity,
} from '../types';
import {
  valuesEqual,
  detectType,
  getDriftSeverity,
  generateDriftId,
  getLatestDate,
} from '../utils';
import { OwnerLoader } from '../loaders/owner-loader';

export interface DiffEngineOptions {
  strict?: boolean;
  strictEnvironments?: string[];
  includeInfo?: boolean;
}

interface CodeFlagMap {
  [key: string]: CodeDefaultFlag[];
}

interface ConfigFlagMap {
  [key: string]: {
    [environment: string]: ConfigCenterFlag;
  };
}

interface DeployFlagMap {
  [key: string]: {
    [environment: string]: DeployEnvFlag[];
  };
}

export class DiffEngine {
  private options: Required<DiffEngineOptions>;
  private ownerLoader: OwnerLoader;

  constructor(options: DiffEngineOptions = {}, ownerLoader: OwnerLoader) {
    this.options = {
      strict: options.strict ?? false,
      strictEnvironments: options.strictEnvironments || ['production', 'prod'],
      includeInfo: options.includeInfo ?? true,
    };
    this.ownerLoader = ownerLoader;
  }

  async diff(
    codeFlags: CodeDefaultFlag[],
    configFlags: ConfigCenterFlag[],
    deployFlags: DeployEnvFlag[],
    ownerConfig: OwnerConfig
  ): Promise<DriftItem[]> {
    const drifts: DriftItem[] = [];

    const codeMap = this.buildCodeMap(codeFlags);
    const configMap = this.buildConfigMap(configFlags);
    const deployMap = this.buildDeployMap(deployFlags);

    const allKeys = new Set<string>([
      ...Object.keys(codeMap),
      ...Object.keys(configMap),
      ...Object.keys(deployMap),
    ]);

    const allEnvironments = this.collectEnvironments(configFlags, deployFlags);

    for (const key of allKeys) {
      const codeEntries = codeMap[key] || [];
      const configEntries = configMap[key] || {};
      const deployEntries = deployMap[key] || {};

      const codeOwner = codeEntries.length > 0
        ? this.ownerLoader.resolveOwner(key, ownerConfig, codeEntries[0].owner)
        : this.ownerLoader.resolveOwner(key, ownerConfig);

      const codeDeprecated = codeEntries.some(f => f.deprecated);
      const configDeprecated = Object.values(configEntries).some(f => f.deprecated);
      const isDeprecated = codeDeprecated || configDeprecated;

      const lastModified = this.getLastModified(codeEntries, Object.values(configEntries), Object.values(deployEntries).flat());

      for (const env of allEnvironments) {
        const hasCode = codeEntries.length > 0;
        const hasConfig = !!configEntries[env];
        const hasDeploy = (deployEntries[env]?.length || 0) > 0;

        const codeFlag = codeEntries[0];
        const configFlag = configEntries[env];
        const deployFlag = deployEntries[env]?.[0];

        const envDrifts = this.checkFlagForEnv(
          key,
          env,
          hasCode,
          hasConfig,
          hasDeploy,
          codeFlag,
          configFlag,
          deployFlag,
          isDeprecated,
          codeOwner,
          lastModified
        );

        drifts.push(...envDrifts);
      }
    }

    if (!this.options.includeInfo) {
      return drifts.filter(d => d.severity !== 'info');
    }

    return this.deduplicateDrifts(drifts);
  }

  private checkFlagForEnv(
    key: string,
    environment: string,
    hasCode: boolean,
    hasConfig: boolean,
    hasDeploy: boolean,
    codeFlag: CodeDefaultFlag | undefined,
    configFlag: ConfigCenterFlag | undefined,
    deployFlag: DeployEnvFlag | undefined,
    isDeprecated: boolean,
    owner: string | undefined,
    lastModified: string | undefined
  ): DriftItem[] {
    const drifts: DriftItem[] = [];

    if (isDeprecated && (hasConfig || hasDeploy)) {
      drifts.push(this.createDrift(
        'deprecated_in_use',
        key,
        environment,
        owner,
        codeFlag,
        configFlag,
        deployFlag,
        undefined,
        undefined,
        lastModified,
        `开关已被标记为废弃，但仍在 ${environment} 环境中使用`
      ));
    }

    if (hasCode && !hasConfig) {
      drifts.push(this.createDrift(
        'missing_in_config',
        key,
        environment,
        owner,
        codeFlag,
        configFlag,
        deployFlag,
        undefined,
        undefined,
        lastModified,
        `代码中定义的开关在 ${environment} 环境的配置中心缺失`
      ));
    }

    if (hasCode && !hasDeploy) {
      drifts.push(this.createDrift(
        'missing_in_deploy',
        key,
        environment,
        owner,
        codeFlag,
        configFlag,
        deployFlag,
        undefined,
        undefined,
        lastModified,
        `代码中定义的开关在 ${environment} 环境的部署配置中缺失`
      ));
    }

    if (!hasCode && (hasConfig || hasDeploy)) {
      drifts.push(this.createDrift(
        'missing_in_code',
        key,
        environment,
        owner,
        codeFlag,
        configFlag,
        deployFlag,
        undefined,
        undefined,
        lastModified,
        `配置中心/部署中存在的开关在代码中未找到定义`
      ));
    }

    if (hasCode && hasConfig && codeFlag && configFlag) {
      if (!valuesEqual(codeFlag.value, configFlag.value)) {
        drifts.push(this.createDrift(
          'default_mismatch',
          key,
          environment,
          owner,
          codeFlag,
          configFlag,
          deployFlag,
          codeFlag.type,
          configFlag.type,
          lastModified,
          `代码默认值与配置中心值不一致（${environment}）`
        ));
      }

      if (codeFlag.type !== configFlag.type) {
        const existingTypeMismatch = drifts.find(d => d.type === 'type_mismatch');
        if (!existingTypeMismatch) {
          drifts.push(this.createDrift(
            'type_mismatch',
            key,
            environment,
            owner,
            codeFlag,
            configFlag,
            deployFlag,
            codeFlag.type,
            configFlag.type,
            lastModified,
            `开关类型不一致：代码为 ${codeFlag.type}，配置中心为 ${configFlag.type}（${environment}）`
          ));
        }
      }
    }

    if (hasCode && hasDeploy && codeFlag && deployFlag) {
      if (!valuesEqual(codeFlag.value, deployFlag.value)) {
        drifts.push(this.createDrift(
          'deploy_mismatch',
          key,
          environment,
          owner,
          codeFlag,
          configFlag,
          deployFlag,
          codeFlag.type,
          deployFlag.type,
          lastModified,
          `代码默认值与部署值不一致（${environment}）`
        ));
      }

      if (codeFlag.type !== deployFlag.type) {
        const existingTypeMismatch = drifts.find(d => d.type === 'type_mismatch');
        if (!existingTypeMismatch) {
          drifts.push(this.createDrift(
            'type_mismatch',
            key,
            environment,
            owner,
            codeFlag,
            configFlag,
            deployFlag,
            codeFlag.type,
            deployFlag.type,
            lastModified,
            `开关类型不一致：代码为 ${codeFlag.type}，部署为 ${deployFlag.type}（${environment}）`
          ));
        }
      }
    }

    if (hasConfig && hasDeploy && configFlag && deployFlag) {
      if (!valuesEqual(configFlag.value, deployFlag.value)) {
        drifts.push(this.createDrift(
          'deploy_mismatch',
          key,
          environment,
          owner,
          codeFlag,
          configFlag,
          deployFlag,
          configFlag.type,
          deployFlag.type,
          lastModified,
          `配置中心值与部署值不一致（${environment}）`
        ));
      }
    }

    return drifts;
  }

  private createDrift(
    type: DriftType,
    key: string,
    environment: string,
    owner: string | undefined,
    codeFlag: CodeDefaultFlag | undefined,
    configFlag: ConfigCenterFlag | undefined,
    deployFlag: DeployEnvFlag | undefined,
    expectedType: FlagType | undefined,
    actualType: FlagType | undefined,
    lastModified: string | undefined,
    description: string
  ): DriftItem {
    const severity: DriftSeverity = this.options.strict
      ? this.getStrictSeverity(type, environment)
      : getDriftSeverity(type, environment);

    const sources: DriftItem['sources'] = [];

    if (codeFlag) {
      sources.push({
        name: 'code',
        value: codeFlag.value,
        location: codeFlag.file,
        line: codeFlag.line,
        lastModified: codeFlag.lastModified,
      });
    }

    if (configFlag) {
      sources.push({
        name: `config_center:${configFlag.environment}`,
        value: configFlag.value,
        lastModified: configFlag.updatedAt || configFlag.lastModified,
      });
    }

    if (deployFlag) {
      sources.push({
        name: `deploy_env:${deployFlag.environment}${deployFlag.cluster ? `:${deployFlag.cluster}` : ''}`,
        value: deployFlag.value,
        lastModified: deployFlag.lastModified,
      });
    }

    return {
      id: generateDriftId(type, key, environment),
      key,
      type,
      severity,
      owner,
      description,
      codeDefault: codeFlag?.value,
      configValue: configFlag?.value,
      deployValue: deployFlag?.value,
      expectedType,
      actualType,
      environments: [environment],
      sources,
      lastModified,
    };
  }

  private getStrictSeverity(type: DriftType, environment: string): DriftSeverity {
    const isStrictEnv = this.options.strictEnvironments.some(
      e => environment.toLowerCase() === e.toLowerCase()
    );

    if (!isStrictEnv) {
      return getDriftSeverity(type, environment);
    }

    switch (type) {
      case 'missing_in_config':
      case 'missing_in_deploy':
      case 'default_mismatch':
      case 'deploy_mismatch':
      case 'type_mismatch':
        return 'critical';
      case 'deprecated_in_use':
        return 'warning';
      case 'missing_in_code':
        return 'info';
      default:
        return 'info';
    }
  }

  private buildCodeMap(flags: CodeDefaultFlag[]): CodeFlagMap {
    const map: CodeFlagMap = {};
    for (const flag of flags) {
      if (!map[flag.key]) {
        map[flag.key] = [];
      }
      map[flag.key].push(flag);
    }
    return map;
  }

  private buildConfigMap(flags: ConfigCenterFlag[]): ConfigFlagMap {
    const map: ConfigFlagMap = {};
    for (const flag of flags) {
      if (!map[flag.key]) {
        map[flag.key] = {};
      }
      map[flag.key][flag.environment] = flag;
    }
    return map;
  }

  private buildDeployMap(flags: DeployEnvFlag[]): DeployFlagMap {
    const map: DeployFlagMap = {};
    for (const flag of flags) {
      if (!map[flag.key]) {
        map[flag.key] = {};
      }
      if (!map[flag.key][flag.environment]) {
        map[flag.key][flag.environment] = [];
      }
      map[flag.key][flag.environment].push(flag);
    }
    return map;
  }

  private collectEnvironments(
    configFlags: ConfigCenterFlag[],
    deployFlags: DeployEnvFlag[]
  ): string[] {
    const envs = new Set<string>();
    for (const f of configFlags) envs.add(f.environment);
    for (const f of deployFlags) envs.add(f.environment);

    if (envs.size === 0) {
      envs.add('default');
    }

    const priority = ['production', 'prod', 'staging', 'development', 'dev', 'test', 'qa', 'uat', 'default'];
    return Array.from(envs).sort((a, b) => {
      const ai = priority.findIndex(p => a.toLowerCase().includes(p));
      const bi = priority.findIndex(p => b.toLowerCase().includes(p));
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  private getLastModified(
    codeFlags: CodeDefaultFlag[],
    configFlags: ConfigCenterFlag[],
    deployFlags: DeployEnvFlag[]
  ): string | undefined {
    const dates: string[] = [];

    for (const f of codeFlags) {
      if (f.lastModified) dates.push(f.lastModified);
    }
    for (const f of configFlags) {
      if (f.updatedAt) dates.push(f.updatedAt);
      if (f.lastModified) dates.push(f.lastModified);
    }
    for (const f of deployFlags) {
      if (f.lastModified) dates.push(f.lastModified);
    }

    return getLatestDate(dates);
  }

  private deduplicateDrifts(drifts: DriftItem[]): DriftItem[] {
    const seen = new Map<string, DriftItem>();

    for (const drift of drifts) {
      const key = `${drift.type}:${drift.key}`;
      const existing = seen.get(key);

      if (existing) {
        const mergedEnvs = new Set([...(existing.environments || []), ...(drift.environments || [])]);
        existing.environments = Array.from(mergedEnvs);

        if (!existing.lastModified && drift.lastModified) {
          existing.lastModified = drift.lastModified;
        } else if (existing.lastModified && drift.lastModified) {
          existing.lastModified = getLatestDate([existing.lastModified, drift.lastModified]);
        }

        const existingSeverityRank = { critical: 3, warning: 2, info: 1 }[existing.severity];
        const newSeverityRank = { critical: 3, warning: 2, info: 1 }[drift.severity];
        if (newSeverityRank > existingSeverityRank) {
          existing.severity = drift.severity;
        }
      } else {
        seen.set(key, { ...drift });
      }
    }

    return Array.from(seen.values());
  }

  isStrictModeFailure(drifts: DriftItem[]): { failed: boolean; reasons: string[] } {
    if (!this.options.strict) {
      return { failed: false, reasons: [] };
    }

    const reasons: string[] = [];

    for (const drift of drifts) {
      const involvesStrictEnv = (drift.environments || []).some(env =>
        this.options.strictEnvironments.some(e => env.toLowerCase() === e.toLowerCase())
      );

      if (!involvesStrictEnv) continue;

      if (drift.severity === 'critical') {
        reasons.push(
          `[${drift.key}] ${drift.type}: ${drift.description}`
        );
      }
    }

    return {
      failed: reasons.length > 0,
      reasons,
    };
  }
}
