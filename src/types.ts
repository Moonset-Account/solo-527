export type FlagValue = string | number | boolean | null | object | unknown[];

export type FlagType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'unknown';

export type DriftSeverity = 'critical' | 'warning' | 'info';

export type DriftType =
  | 'missing_in_config'
  | 'missing_in_deploy'
  | 'missing_in_code'
  | 'default_mismatch'
  | 'deploy_mismatch'
  | 'deprecated_in_use'
  | 'type_mismatch';

export interface FlagSource {
  key: string;
  value: FlagValue;
  type: FlagType;
  source: string;
  line?: number;
  lastModified?: string;
  owner?: string;
  description?: string;
  deprecated?: boolean;
  deprecatedReason?: string;
}

export interface CodeDefaultFlag extends FlagSource {
  source: 'code';
  file: string;
  line: number;
}

export interface ConfigCenterFlag extends FlagSource {
  source: 'config_center';
  environment: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DeployEnvFlag extends FlagSource {
  source: 'deploy_env';
  environment: string;
  cluster?: string;
}

export interface DriftItem {
  id: string;
  key: string;
  type: DriftType;
  severity: DriftSeverity;
  owner?: string;
  description?: string;
  codeDefault?: FlagValue;
  configValue?: FlagValue;
  deployValue?: FlagValue;
  expectedType?: FlagType;
  actualType?: FlagType;
  environments?: string[];
  cluster?: string;
  sources: Array<{
    name: string;
    value?: FlagValue;
    location?: string;
    line?: number;
    lastModified?: string;
  }>;
  lastModified?: string;
}

export interface OwnerSummary {
  owner: string;
  totalDrifts: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  drifts: DriftItem[];
  flags: string[];
}

export interface DriftReport {
  generatedAt: string;
  schemaVersion: string;
  summary: {
    totalFlags: number;
    codeFlags: number;
    configFlags: number;
    deployFlags: number;
    totalDrifts: number;
    byType: Record<DriftType, number>;
    bySeverity: Record<DriftSeverity, number>;
    byEnvironment: Record<string, number>;
  };
  sources: {
    code: string[];
    configCenter: Array<{ file: string; environment: string }>;
    deployEnv: Array<{ file: string; environment: string }>;
  };
  drifts: DriftItem[];
  byOwner: OwnerSummary[];
  unassignedDrifts: DriftItem[];
  strictModeFailed: boolean;
  strictModeReasons: string[];
}

export interface CLIOptions {
  codePaths?: string[];
  configFiles?: string[];
  deployFiles?: string[];
  environments?: string[];
  output?: string;
  format?: 'json' | 'table' | 'markdown';
  strict?: boolean;
  ownerFile?: string;
  includeInfo?: boolean;
  deprecatedOnly?: boolean;
  code?: string[];
  config?: string[];
  deploy?: string[];
  env?: string[];
  owners?: string;
}

export interface OwnerConfigEntry {
  pattern: string;
  owner: string;
  description?: string;
}

export interface OwnerConfig {
  owners: OwnerConfigEntry[];
  defaultOwner?: string;
}
