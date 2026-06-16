import db from '@adonisjs/lucid/services/db'
import ChangeLog from '#models/change_log'

export default class ChangeLogService {
  public static async logChange(
    entityType: string,
    entityId: number,
    action: string,
    fieldName: string | null,
    oldValue: string | null,
    newValue: string | null,
    changedBy: number,
    trx?: any
  ): Promise<ChangeLog> {
    const data = {
      entityType,
      entityId,
      action,
      fieldName,
      oldValue,
      newValue,
      changedBy,
    }

    if (trx) {
      return await ChangeLog.create(data, { client: trx })
    }

    return await ChangeLog.create(data)
  }

  public static async logEntityChanges<T extends Record<string, any>>(
    entityType: string,
    entityId: number,
    oldValues: T,
    newValues: Partial<T>,
    changedBy: number,
    trx?: any
  ): Promise<ChangeLog[]> {
    const logs: ChangeLog[] = []

    for (const [key, newValue] of Object.entries(newValues)) {
      const oldValue = oldValues[key as keyof T]
      if (oldValue !== newValue && key !== 'updatedAt' && key !== 'createdAt') {
        const log = await this.logChange(
          entityType,
          entityId,
          'update',
          key,
          oldValue !== undefined ? String(oldValue) : null,
          newValue !== undefined ? String(newValue) : null,
          changedBy,
          trx
        )
        logs.push(log)
      }
    }

    return logs
  }

  public static async getEntityHistory(
    entityType: string,
    entityId: number,
    page: number = 1,
    perPage: number = 20
  ) {
    return ChangeLog.query()
      .where('entityType', entityType)
      .where('entityId', entityId)
      .orderBy('createdAt', 'desc')
      .paginate(page, perPage)
  }

  public static async getRecentChanges(limit: number = 50) {
    return ChangeLog.query()
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .preload('changer')
  }
}
