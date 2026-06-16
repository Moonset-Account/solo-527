import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ReminderRule from '#models/reminder_rule'

export default class ReminderRuleSeeder extends BaseSeeder {
  public async run() {
    await ReminderRule.createMany([
      {
        name: '库存低于安全线',
        entityType: 'product',
        metric: 'currentStock',
        operator: 'lte',
        threshold: 0,
        level: 'normal',
        messageTemplate: '产品 {{entity_type}} #{{entity_id}} 的 {{metric}} 值为 {{score}}，已达到安全库存线，请及时补货',
        timeoutMinutes: 1440,
        escalationLevel: 'urgent',
        isActive: true,
      },
      {
        name: '库存严重不足',
        entityType: 'product',
        metric: 'currentStock',
        operator: 'lte',
        threshold: 0,
        level: 'urgent',
        messageTemplate: '产品 {{entity_type}} #{{entity_id}} 的 {{metric}} 值为 {{score}}，库存严重不足，请立即补货！',
        timeoutMinutes: 360,
        escalationLevel: 'escalation',
        isActive: true,
      },
      {
        name: '缺席率过高',
        entityType: 'appointment',
        metric: 'noShowRate',
        operator: 'gte',
        threshold: 20,
        level: 'normal',
        messageTemplate: '预约缺席率 {{score}}% 已超过阈值 20%，请关注客户预约管理',
        timeoutMinutes: 0,
        escalationLevel: null,
        isActive: true,
      },
      {
        name: '产品评分过低',
        entityType: 'product',
        metric: 'evaluationScore',
        operator: 'lte',
        threshold: 3,
        level: 'urgent',
        messageTemplate: '产品 #{{entity_id}} 的评分为 {{score}}，低于3分，请检查产品质量',
        timeoutMinutes: 2880,
        escalationLevel: 'escalation',
        isActive: true,
      },
    ])
  }
}
