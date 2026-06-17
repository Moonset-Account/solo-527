import { BaseService } from './base-service'
import type { SystemConfig, ConfigChangeLog } from '@/types/database'
import { mockSystemConfigs, mockConfigChangeLogs } from '@/lib/mock-data'

class SystemConfigService extends BaseService<SystemConfig> {
  private changeLogs: ConfigChangeLog[] = []

  constructor() {
    super({ tableName: 'system_configs', useMock: true })
    this.setMockData(mockSystemConfigs)
    this.changeLogs = [...mockConfigChangeLogs]
  }

  async getByKey(key: string): Promise<SystemConfig | null> {
    const all = await this.getAll()
    return all.find((c) => c.key === key) ?? null
  }

  async getValue(key: string, defaultValue = ''): Promise<string> {
    const config = await this.getByKey(key)
    return config?.value ?? defaultValue
  }

  async isModuleEnabled(moduleKey: string): Promise<boolean> {
    const value = await this.getValue(moduleKey, 'true')
    return value === 'true'
  }

  async updateConfig(id: string, value: string, updatedBy: string): Promise<SystemConfig | null> {
    const oldConfig = await this.getById(id)
    if (!oldConfig) return null

    const updated = await this.update(id, {
      value,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })

    if (updated) {
      const changeLog: ConfigChangeLog = {
        id: `ccl-${Date.now()}`,
        config_key: oldConfig.key,
        old_value: oldConfig.value,
        new_value: value,
        changed_by: updatedBy,
        changed_at: new Date().toISOString(),
      }
      this.changeLogs.unshift(changeLog)
    }

    return updated
  }

  async getChangeLogs(configKey?: string): Promise<ConfigChangeLog[]> {
    let logs = [...this.changeLogs]
    if (configKey) {
      logs = logs.filter((l) => l.config_key === configKey)
    }
    return logs.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
  }
}

export const systemConfigService = new SystemConfigService()
