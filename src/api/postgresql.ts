import type { LowSampleConfig, CurrencyExchangeRate, SupersetPermission, UserRole } from "@/types"
import { pgStore } from "./migrate"
import { POSTGRESQL_CONFIG } from "./config"

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
  private getConnectionInfo() {
    return {
      host: POSTGRESQL_CONFIG.host,
      port: POSTGRESQL_CONFIG.port,
      database: POSTGRESQL_CONFIG.database,
      schema: POSTGRESQL_CONFIG.schema,
      status: "connected" as const,
    }
  }

  getLowSampleConfig(): LowSampleConfig[] {
    const rows = pgStore.lowSampleConfig.select()
    return rows.map((r) => ({
      dimension: r.dimension as string,
      threshold: r.threshold as number,
      enabled: r.enabled as boolean,
    }))
  }

  updateLowSampleThreshold(dimension: string, threshold: number): void {
    const rows = pgStore.lowSampleConfig.select(
      (r) => r.dimension === dimension
    )
    for (const row of rows) {
      row.threshold = threshold
      row.updated_at = new Date().toISOString()
    }
    console.log(`[PostgreSQL] UPDATE low_sample_config SET threshold=${threshold} WHERE dimension='${dimension}'`)
  }

  getCurrencyExchangeRates(): CurrencyExchangeRate[] {
    const rows = pgStore.currencyExchange.select()
    return rows.map((r) => ({
      currency: r.currency as string,
      exchangeRateToUSD: r.exchange_rate_to_usd as number,
      effectiveDate: r.effective_date as string,
    }))
  }

  getExchangeRate(currency: string): number {
    const row = pgStore.currencyExchange.select(
      (r) => r.currency === currency
    )[0]
    return row ? (row.exchange_rate_to_usd as number) : 1.0
  }

  convertToUSD(amount: number, currency: string): number {
    const rate = this.getExchangeRate(currency)
    return +(amount * rate).toFixed(2)
  }

  getUserRole(userId: string): UserRole {
    const roleRow = pgStore.userRoles.select(
      (r) => r.user_id === userId
    )[0]
    if (!roleRow) return { name: "unknown", permissions: [] }

    const permRows = pgStore.userPermissions.select(
      (r) => r.user_id === userId
    )
    const permissions: SupersetPermission[] = permRows.map((r) => ({
      resource: r.resource as string,
      actions: (r.actions as string).replace(/[{}]/g, "").split(","),
    }))

    return {
      name: roleRow.role_name as string,
      permissions,
    }
  }

  getUserPermissions(userId: string): SupersetPermission[] {
    return this.getUserRole(userId).permissions
  }
}

export const pgMeta = new PostgreSQLMetadataStore()
