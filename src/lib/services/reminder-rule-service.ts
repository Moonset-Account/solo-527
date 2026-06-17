import { BaseService } from './base-service'
import type { ReminderRule } from '@/types/database'
import { mockReminderRules } from '@/lib/mock-data'

class ReminderRuleService extends BaseService<ReminderRule> {
  constructor() {
    super({ tableName: 'reminder_rules', useMock: true })
    this.setMockData(mockReminderRules)
  }

  async getActive(): Promise<ReminderRule[]> {
    const all = await this.getAll()
    return all.filter((r) => r.is_active)
  }

  async getByType(ruleType: string): Promise<ReminderRule[]> {
    const all = await this.getAll()
    return all.filter((r) => r.rule_type === ruleType)
  }

  async getByUrgency(urgency: string): Promise<ReminderRule[]> {
    const all = await this.getAll()
    return all.filter((r) => r.urgency_level === urgency)
  }
}

export const reminderRuleService = new ReminderRuleService()
