import Reminder from '#models/reminder'
import ReminderRule from '#models/reminder_rule'
import { DateTime } from 'luxon'

export default class ReminderService {
  public static async evaluateAndCreate(
    entityType: string,
    entityId: number,
    metric: string,
    score: number
  ) {
    const rules = await ReminderRule.query()
      .where('entityType', entityType)
      .where('metric', metric)
      .where('isActive', true)

    for (const rule of rules) {
      const triggered = this.evaluateOperator(score, rule.operator, rule.threshold)

      if (triggered) {
        const existingReminder = await Reminder.query()
          .where('ruleId', rule.id)
          .where('entityType', entityType)
          .where('entityId', entityId)
          .where('isResolved', false)
          .first()

        if (!existingReminder) {
          const message = rule.messageTemplate
            .replace('{{entity_type}}', entityType)
            .replace('{{entity_id}}', String(entityId))
            .replace('{{metric}}', metric)
            .replace('{{score}}', String(score))

          await Reminder.create({
            ruleId: rule.id,
            entityType,
            entityId,
            level: rule.level,
            title: `[${rule.level.toUpperCase()}] ${rule.name}`,
            message,
            isRead: false,
            isResolved: false,
          })
        }
      }
    }
  }

  private static evaluateOperator(
    score: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case 'gt':
        return score > threshold
      case 'gte':
        return score >= threshold
      case 'lt':
        return score < threshold
      case 'lte':
        return score <= threshold
      case 'eq':
        return score === threshold
      case 'neq':
        return score !== threshold
      default:
        return false
    }
  }

  public static async checkTimeoutAndEscalate() {
    const unresolvedReminders = await Reminder.query()
      .where('isResolved', false)
      .where('level', 'normal')
      .preload('rule')

    const now = DateTime.local()

    for (const reminder of unresolvedReminders) {
      const rule = reminder.rule
      if (rule.timeoutMinutes > 0 && rule.escalationLevel) {
        const elapsed = now.diff(reminder.createdAt, 'minutes').minutes
        if (elapsed >= rule.timeoutMinutes) {
          await this.escalateReminder(reminder, rule.escalationLevel)
        }
      }
    }
  }

  public static async escalateReminder(reminder: Reminder, escalationLevel: string) {
    reminder.level = escalationLevel
    reminder.escalatedAt = DateTime.local()
    await reminder.save()

    return reminder
  }

  public static async resolveReminder(reminderId: number) {
    const reminder = await Reminder.findOrFail(reminderId)
    reminder.isResolved = true
    reminder.resolvedAt = DateTime.local()
    await reminder.save()

    return reminder
  }

  public static async markAsRead(reminderId: number) {
    const reminder = await Reminder.findOrFail(reminderId)
    reminder.isRead = true
    await reminder.save()

    return reminder
  }

  public static async getUnreadCount(userId?: number) {
    const query = Reminder.query().where('isRead', false).where('isResolved', false)
    if (userId) {
      query.where('assignedTo', userId)
    }
    return query.count('* as total').first()
  }
}
