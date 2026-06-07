import type { LowSampleConfig, CurrencyExchangeRate, UserRole, SupersetPermission } from '@/types'

export const POSTGRESQL_DDL = `
CREATE TABLE IF NOT EXISTS public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL UNIQUE,
  role_name VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL REFERENCES public.user_roles(user_id),
  resource VARCHAR(128) NOT NULL,
  actions TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.low_sample_config (
  id SERIAL PRIMARY KEY,
  dimension VARCHAR(64) NOT NULL UNIQUE,
  threshold INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.currency_exchange (
  id SERIAL PRIMARY KEY,
  currency VARCHAR(8) NOT NULL UNIQUE,
  exchange_rate_to_usd DECIMAL(18, 8) NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`

class PostgreSQLMetadataStore {
  private lowSampleConfigs: LowSampleConfig[]
  private exchangeRates: CurrencyExchangeRate[]
  private userRoles: Map<string, UserRole>

  constructor() {
    const today = new Date().toISOString().split('T')[0]

    this.lowSampleConfigs = [
      { dimension: 'sku', threshold: 30, enabled: true },
      { dimension: 'logistics_node', threshold: 50, enabled: true },
      { dimension: 'quality_conclusion', threshold: 20, enabled: true },
    ]

    this.exchangeRates = [
      { currency: 'USD', exchangeRateToUSD: 1.0, effectiveDate: today },
      { currency: 'EUR', exchangeRateToUSD: 1.08, effectiveDate: today },
      { currency: 'GBP', exchangeRateToUSD: 1.27, effectiveDate: today },
      { currency: 'JPY', exchangeRateToUSD: 0.0064, effectiveDate: today },
      { currency: 'AUD', exchangeRateToUSD: 0.65, effectiveDate: today },
    ]

    const operatorPerms: SupersetPermission[] = [
      { resource: 'dashboard', actions: ['view_all'] },
      { resource: 'csv', actions: ['export'] },
      { resource: 'dataset', actions: ['read_all'] },
    ]

    const warehouseAdminPerms: SupersetPermission[] = [
      ...operatorPerms,
      { resource: 'warehouse_damage', actions: ['mark'] },
      { resource: 'quality_conclusion', actions: ['write'] },
    ]

    const qualitySupervisorPerms: SupersetPermission[] = [
      ...warehouseAdminPerms,
      { resource: 'return_reason_mapping', actions: ['write'] },
      { resource: 'low_sample_config', actions: ['write'] },
    ]

    this.userRoles = new Map<string, UserRole>([
      ['u001', { name: '运营人员', permissions: operatorPerms }],
      ['u002', { name: '仓配管理员', permissions: warehouseAdminPerms }],
      ['u003', { name: '质控主管', permissions: qualitySupervisorPerms }],
    ])
  }

  getLowSampleConfig(): LowSampleConfig[] {
    return this.lowSampleConfigs
  }

  updateLowSampleThreshold(dimension: string, threshold: number): void {
    const config = this.lowSampleConfigs.find((c) => c.dimension === dimension)
    if (config) {
      config.threshold = threshold
    }
  }

  getCurrencyExchangeRates(): CurrencyExchangeRate[] {
    return this.exchangeRates
  }

  getExchangeRate(currency: string): number {
    const rate = this.exchangeRates.find((r) => r.currency === currency)
    return rate ? rate.exchangeRateToUSD : 1.0
  }

  convertToUSD(amount: number, currency: string): number {
    return amount * this.getExchangeRate(currency)
  }

  getUserRole(userId: string): UserRole {
    return this.userRoles.get(userId) ?? { name: 'unknown', permissions: [] }
  }

  getUserPermissions(userId: string): SupersetPermission[] {
    return this.getUserRole(userId).permissions
  }
}

export const pgMeta = new PostgreSQLMetadataStore()
