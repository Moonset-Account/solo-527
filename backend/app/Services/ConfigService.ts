import ConfigDictionary from 'App/Models/ConfigDictionary'
import CacheService from './CacheService'

export default class ConfigService {
  private static CACHE_PREFIX = 'config:dict:'

  public static async getStatusDict(dictType?: string) {
    const cacheKey = `${this.CACHE_PREFIX}${dictType || 'all'}`
    const cached = await CacheService.get(cacheKey)
    if (cached) return cached

    const query = ConfigDictionary.query().where('isEnabled', true).orderBy('sortOrder', 'asc')
    if (dictType) {
      query.where('dictType', dictType)
    }
    const items = await query
    const result = dictType
      ? items.map((i) => ({ key: i.dictKey, value: i.dictValue, label: i.label, color: i.color }))
      : items.reduce((acc, item) => {
          if (!acc[item.dictType]) acc[item.dictType] = []
          acc[item.dictType].push({ key: item.dictKey, value: item.dictValue, label: item.label, color: item.color })
          return acc
        }, {} as Record<string, any[]>)

    await CacheService.set(cacheKey, result, 360)
    return result
  }

  public static async updateStatusDict(dictType: string, items: { dictKey: string; dictValue: string; label: string; color?: string; sortOrder?: number }[]) {
    for (const item of items) {
      await ConfigDictionary.updateOrCreate(
        { dictType, dictKey: item.dictKey },
        {
          dictValue: item.dictValue,
          label: item.label,
          color: item.color,
          sortOrder: item.sortOrder || 0,
          isEnabled: true,
        }
      )
    }
    await CacheService.invalidatePattern(`${this.CACHE_PREFIX}*`)
    return true
  }

  public static async seedInitialDicts() {
    const dicts = [
      { dictType: 'partnership_stage', dictKey: 'lead', dictValue: 'lead', label: '线索阶段', color: '#9ca3af', sortOrder: 1 },
      { dictType: 'partnership_stage', dictKey: 'negotiation', dictValue: 'negotiation', label: '洽谈阶段', color: '#3b82f6', sortOrder: 2 },
      { dictType: 'partnership_stage', dictKey: 'contracting', dictValue: 'contracting', label: '签约阶段', color: '#f59e0b', sortOrder: 3 },
      { dictType: 'partnership_stage', dictKey: 'executing', dictValue: 'executing', label: '执行阶段', color: '#10b981', sortOrder: 4 },
      { dictType: 'partnership_stage', dictKey: 'completed', dictValue: 'completed', label: '已完成', color: '#6366f1', sortOrder: 5 },
      { dictType: 'partnership_stage', dictKey: 'cancelled', dictValue: 'cancelled', label: '已取消', color: '#ef4444', sortOrder: 6 },

      { dictType: 'partnership_status', dictKey: 'active', dictValue: 'active', label: '进行中', color: '#10b981', sortOrder: 1 },
      { dictType: 'partnership_status', dictKey: 'paused', dictValue: 'paused', label: '暂停', color: '#f59e0b', sortOrder: 2 },
      { dictType: 'partnership_status', dictKey: 'completed', dictValue: 'completed', label: '已完成', color: '#6366f1', sortOrder: 3 },
      { dictType: 'partnership_status', dictKey: 'cancelled', dictValue: 'cancelled', label: '已终止', color: '#ef4444', sortOrder: 4 },

      { dictType: 'benefit_type', dictKey: 'pre_roll', dictValue: 'pre_roll', label: '片头口播', color: '#3b82f6', sortOrder: 1 },
      { dictType: 'benefit_type', dictKey: 'mid_roll', dictValue: 'mid_roll', label: '片中植入', color: '#8b5cf6', sortOrder: 2 },
      { dictType: 'benefit_type', dictKey: 'post_roll', dictValue: 'post_roll', label: '片尾鸣谢', color: '#06b6d4', sortOrder: 3 },
      { dictType: 'benefit_type', dictKey: 'description_link', dictValue: 'description_link', label: '简介链接', color: '#10b981', sortOrder: 4 },
      { dictType: 'benefit_type', dictKey: 'sponsored_video', dictValue: 'sponsored_video', label: '定制视频', color: '#f59e0b', sortOrder: 5 },
      { dictType: 'benefit_type', dictKey: 'pin_comment', dictValue: 'pin_comment', label: '置顶评论', color: '#ec4899', sortOrder: 6 },

      { dictType: 'order_status', dictKey: 'pending', dictValue: 'pending', label: '待处理', color: '#f59e0b', sortOrder: 1 },
      { dictType: 'order_status', dictKey: 'processing', dictValue: 'processing', label: '处理中', color: '#3b82f6', sortOrder: 2 },
      { dictType: 'order_status', dictKey: 'completed', dictValue: 'completed', label: '已完成', color: '#10b981', sortOrder: 3 },
      { dictType: 'order_status', dictKey: 'cancelled', dictValue: 'cancelled', label: '已取消', color: '#ef4444', sortOrder: 4 },

      { dictType: 'payment_status', dictKey: 'unpaid', dictValue: 'unpaid', label: '未支付', color: '#ef4444', sortOrder: 1 },
      { dictType: 'payment_status', dictKey: 'paid', dictValue: 'paid', label: '已支付', color: '#10b981', sortOrder: 2 },
      { dictType: 'payment_status', dictKey: 'refunded', dictValue: 'refunded', label: '已退款', color: '#6366f1', sortOrder: 3 },
      { dictType: 'payment_status', dictKey: 'partial_refund', dictValue: 'partial_refund', label: '部分退款', color: '#f59e0b', sortOrder: 4 },

      { dictType: 'subscription_status', dictKey: 'active', dictValue: 'active', label: '活跃', color: '#10b981', sortOrder: 1 },
      { dictType: 'subscription_status', dictKey: 'pending', dictValue: 'pending', label: '待激活', color: '#f59e0b', sortOrder: 2 },
      { dictType: 'subscription_status', dictKey: 'expired', dictValue: 'expired', label: '已过期', color: '#9ca3af', sortOrder: 3 },
      { dictType: 'subscription_status', dictKey: 'cancelled', dictValue: 'cancelled', label: '已取消', color: '#ef4444', sortOrder: 4 },

      { dictType: 'refund_status', dictKey: 'pending', dictValue: 'pending', label: '待处理', color: '#ef4444', sortOrder: 1 },
      { dictType: 'refund_status', dictKey: 'processing', dictValue: 'processing', label: '处理中', color: '#f59e0b', sortOrder: 2 },
      { dictType: 'refund_status', dictKey: 'approved', dictValue: 'approved', label: '已批准', color: '#3b82f6', sortOrder: 3 },
      { dictType: 'refund_status', dictKey: 'rejected', dictValue: 'rejected', label: '已驳回', color: '#9ca3af', sortOrder: 4 },
      { dictType: 'refund_status', dictKey: 'completed', dictValue: 'completed', label: '已完成', color: '#10b981', sortOrder: 5 },

      { dictType: 'refund_type', dictKey: 'duplicate_payment', dictValue: 'duplicate_payment', label: '重复支付', color: '#ef4444', sortOrder: 1 },
      { dictType: 'refund_type', dictKey: 'wrong_amount', dictValue: 'wrong_amount', label: '金额错误', color: '#f59e0b', sortOrder: 2 },
      { dictType: 'refund_type', dictKey: 'user_cancel', dictValue: 'user_cancel', label: '用户取消', color: '#3b82f6', sortOrder: 3 },
      { dictType: 'refund_type', dictKey: 'service_issue', dictValue: 'service_issue', label: '服务问题', color: '#8b5cf6', sortOrder: 4 },
      { dictType: 'refund_type', dictKey: 'other', dictValue: 'other', label: '其他原因', color: '#6b7280', sortOrder: 5 },

      { dictType: 'priority', dictKey: 'high', dictValue: 'high', label: '高', color: '#ef4444', sortOrder: 1 },
      { dictType: 'priority', dictKey: 'normal', dictValue: 'normal', label: '中', color: '#f59e0b', sortOrder: 2 },
      { dictType: 'priority', dictKey: 'low', dictValue: 'low', label: '低', color: '#10b981', sortOrder: 3 },

      { dictType: 'warning_level', dictKey: 'critical', dictValue: 'critical', label: '严重', color: '#ef4444', sortOrder: 1 },
      { dictType: 'warning_level', dictKey: 'warning', dictValue: 'warning', label: '警告', color: '#f59e0b', sortOrder: 2 },
      { dictType: 'warning_level', dictKey: 'info', dictValue: 'info', label: '提示', color: '#3b82f6', sortOrder: 3 },
    ]

    for (const dict of dicts) {
      await ConfigDictionary.firstOrCreate(
        { dictType: dict.dictType, dictKey: dict.dictKey },
        dict
      )
    }
  }
}
