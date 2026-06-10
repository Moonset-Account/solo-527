import { nanoid } from 'nanoid';
import { SupplierModel } from '../models/Supplier.js';
import { QualificationAlertModel, ApprovalBoardItemModel } from '../models/QualificationAlert.js';
import { AlertModel } from '../models/Alert.js';
import {
  Supplier,
  SupplierQualificationStatus,
  QualificationAlert,
  QualificationAlertStatus,
  ApprovalBoardItem,
  DashboardStatus,
  QualificationFile,
  ApiResponse
} from '@app/shared';
import { createChangeHistory, getChangeHistory } from './changeTracker.js';
import { getRedisClient, CACHE_KEYS, CACHE_TTL, NOTIFICATION_CHANNELS } from '../config/redis.js';

function generateSupplierCode(): string {
  return `SUP-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
}

export async function createSupplier(
  data: Partial<Supplier>,
  userId: string,
  userName: string
): Promise<ApiResponse<Supplier>> {
  try {
    const code = generateSupplierCode();
    const supplier = await SupplierModel.create({
      id: nanoid(16),
      code,
      name: data.name,
      shortName: data.shortName,
      category: data.category || [],
      businessLicense: data.businessLicense,
      contactPerson: data.contactPerson,
      address: data.address,
      bankAccount: data.bankAccount,
      qualifications: (data.qualifications || []).map(q => ({
        ...q,
        id: nanoid(12)
      })),
      qualificationStatus: data.qualificationStatus || 'pending' as SupplierQualificationStatus,
      rating: data.rating || 0,
      tags: data.tags || [],
    });

    return {
      success: true,
      data: supplier.toObject() as Supplier,
      message: '供应商已创建'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建失败'
    };
  }
}

export async function updateSupplier(
  id: string,
  data: Partial<Supplier>,
  userId: string,
  userName: string,
  changeReason?: string
): Promise<ApiResponse<Supplier>> {
  try {
    const oldSupplier = await SupplierModel.findOne({
      $or: [{ id }, { _id: id }]
    }).lean().exec();

    if (!oldSupplier) {
      return { success: false, error: '供应商不存在' };
    }

    const updateData: any = { ...data };
    if (data.qualifications) {
      updateData.qualifications = data.qualifications.map(q => ({
        ...q,
        id: q.id || nanoid(12)
      }));
    }

    const updatedSupplier = await SupplierModel.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      { $set: updateData },
      { new: true }
    ).lean().exec();

    await createChangeHistory(
      'supplier',
      oldSupplier.id || String((oldSupplier as any)._id),
      (oldSupplier as any).code,
      oldSupplier,
      updatedSupplier,
      userId,
      userName,
      changeReason
    );

    const redis = getRedisClient();
    redis.del(`${CACHE_KEYS.APPROVAL_BOARD}*`);

    return {
      success: true,
      data: updatedSupplier as Supplier,
      message: '供应商已更新'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失败'
    };
  }
}

export async function checkAndCreateQualificationAlerts(): Promise<ApiResponse<QualificationAlert[]>> {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const createdAlerts: QualificationAlert[] = [];

    const suppliers = await SupplierModel.find().lean().exec();

    for (const supplier of suppliers as Supplier[]) {
      const supplierId = supplier.id || String((supplier as any)._id);

      for (const qual of supplier.qualifications) {
        const daysLeft = Math.ceil(
          (new Date(qual.expiryDate).getTime() - now.getTime()
        ) / (1000 * 60 * 60 * 24);

        let issueType: 'expiring' | 'expired' | null = null;

        if (daysLeft <= 0) {
          issueType = 'expired';
        } else if (daysLeft <= 30) {
          issueType = 'expiring';
        }

        if (issueType) {
          const existing = await QualificationAlertModel.findOne({
            supplierId,
            qualificationName: qual.name,
            status: { $in: ['pending', 'processing'] }
          }).exec();

          if (!existing) {
            const alert = await QualificationAlertModel.create({
              id: nanoid(16),
              supplierId,
              supplierName: supplier.name,
              qualificationName: qual.name,
              issueType,
              expiryDate: qual.expiryDate,
              daysLeft: Math.floor(daysLeft),
              status: 'pending' as QualificationAlertStatus
            });
            createdAlerts.push(alert.toObject() as QualificationAlert);

            await AlertModel.create({
              id: nanoid(16),
              type: issueType === 'expired' ? 'qualification_expired' : 'qualification_expiring',
              level: issueType === 'expired' ? 'critical' : 'warning',
              title: `资质${issueType === 'expired' ? '已过期' : '即将到期'}提醒`,
              message: `供应商【${supplier.name}】的【${qual.name}】${issueType === 'expired' ? `已过期${Math.abs(Math.floor(daysLeft))}天` : `还有${Math.floor(daysLeft)}天到期`,
              relatedId: alert.id,
              relatedType: 'qualification_alert',
              recipientIds: [],
            });

            const redis = getRedisClient();
            redis.publish(
              NOTIFICATION_CHANNELS.QUALIFICATION_ALERT,
              JSON.stringify({
                alertId: alert.id,
                supplierId,
                supplierName: supplier.name,
                issueType
              })
            );
          }
        }
      }

      const expiredOrExpiring = (supplier.qualifications || []).some(q => {
        const daysLeft = Math.ceil(
          (new Date(q.expiryDate).getTime() - now.getTime()
        ) / (1000 * 60 * 60 * 24);
        return daysLeft <= 30;
      });

      if (expiredOrExpiring) {
        await SupplierModel.findByIdAndUpdate(
          (supplier as any)._id,
          { $set: { qualificationStatus: 'warning' } }
        );
      }
    }

    return {
      success: true,
      data: createdAlerts,
      message: `检查完成，创建了 ${createdAlerts.length} 条提醒`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '检查失败'
    };
  }
}

export async function assignQualificationAlert(
  alertId: string,
  assigneeId: string,
  assigneeName: string
): Promise<ApiResponse<QualificationAlert>> {
  try {
    const alert = await QualificationAlertModel.findOneAndUpdate(
      { $or: [{ id: alertId }, { _id: alertId }] },
      {
        $set: {
          status: 'processing' as QualificationAlertStatus,
          assigneeId,
          assigneeName,
          respondedAt: new Date()
        }
      },
      { new: true }
    ).lean().exec();

    if (!alert) {
      return { success: false, error: '提醒不存在' };
    }

    return {
      success: true,
      data: alert as QualificationAlert,
      message: '已分配处理'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败'
    };
  }
}

export async function resolveQualificationAlert(
  alertId: string,
  resolution: string,
  userId: string,
  userName: string
): Promise<ApiResponse<{ alert: QualificationAlert; boardItem: ApprovalBoardItem }>> {
  try {
    const alert = await QualificationAlertModel.findOne({
      $or: [{ id: alertId }, { _id: alertId }]
    }).lean().exec();

    if (!alert) {
      return { success: false, error: '提醒不存在' };
    }

    const now = new Date();
    const receivedAt = (alert as QualificationAlert).respondedAt || (alert as QualificationAlert).createdAt;
    const durationHours = Math.round(
      (now.getTime() - new Date(receivedAt).getTime()) / (1000 * 60 * 60) * 100
    ) / 100;

    const resolvedAlert = await QualificationAlertModel.findOneAndUpdate(
      { $or: [{ id: alertId }, { _id: alertId }] },
      {
        $set: {
          status: 'resolved' as QualificationAlertStatus,
          resolution,
          resolvedAt: now,
          approvalDurationHours: durationHours
        }
      },
      { new: true }
    ).lean().exec();

    const boardItem = await ApprovalBoardItemModel.create({
      id: nanoid(16),
      alertId: (alert as QualificationAlert).id,
      supplierId: (alert as QualificationAlert).supplierId,
      supplierName: (alert as QualificationAlert).supplierName,
      qualificationName: (alert as QualificationAlert).qualificationName,
      issueType: (alert as QualificationAlert).issueType,
      assigneeId: userId,
      assigneeName: userName,
      status: 'approved' as DashboardStatus,
      receivedAt,
      processedAt: now,
      durationHours,
      remark: resolution
    });

    const redis = getRedisClient();
    redis.del(`${CACHE_KEYS.APPROVAL_BOARD}stats`);

    return {
      success: true,
      data: {
        alert: resolvedAlert as QualificationAlert,
        boardItem: boardItem.toObject() as ApprovalBoardItem
      },
      message: '已完成处理，数据已写入审批时长看板'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败'
    };
  }
}

export async function getApprovalBoardStats(assigneeId?: string): Promise<ApiResponse<any>> {
  try {
    const cacheKey = `${CACHE_KEYS.APPROVAL_BOARD}stats:${assigneeId || 'all'}`;
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);

    if (cached) {
      return { success: true, data: JSON.parse(cached) };
    }

    const filter: any = {};
    if (assigneeId) filter.assigneeId = assigneeId;

    const items = await ApprovalBoardItemModel
      .find(filter)
      .sort({ receivedAt: -1 })
      .lean()
      .exec();

    const total = items.length;
    const approved = items.filter(i => i.status === 'approved').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const rejected = items.filter(i => i.status === 'rejected').length;
    const avgDuration = total > 0
      ? Math.round(items.reduce((sum, i) => sum + (i as any).durationHours, 0) / total * 100
    ) / 100
      : 0;

    const byMonth: Record<string, { count: number; avgDuration: number }[] = [];
    for (const item of items) {
      const month = new Date((item as any).receivedAt).toISOString().slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { count: 0, totalDuration: 0 };
      byMonth[month].count++;
      byMonth[month].totalDuration += (item as any).durationHours;
    }

    const monthlyStats = Object.entries(byMonth).map(([month, data]) => ({
      month,
      count: data.count,
      avgDuration: Math.round(data.totalDuration / data.count * 100) / 100
    }));

    const stats = {
      total,
      approved,
      pending,
      rejected,
      avgDuration,
      monthlyStats,
      items
    };

    await redis.setex(cacheKey, CACHE_TTL.FIVE_MINUTES, JSON.stringify(stats));

    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}

export async function listQualificationAlerts(
  query: {
    status?: QualificationAlertStatus;
    assigneeId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ApiResponse<QualificationAlert[]>> {
  try {
    const { status, assigneeId, page = 1, pageSize = 20 } = query;
    const filter: any = {};
    if (status) filter.status = status;
    if (assigneeId) filter.assigneeId = assigneeId;

    const total = await QualificationAlertModel.countDocuments(filter);
    const list = await QualificationAlertModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    return {
      success: true,
      data: list as QualificationAlert[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}

export async function listSuppliers(
  query: {
    qualificationStatus?: SupplierQualificationStatus;
    name?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ApiResponse<Supplier[]>> {
  try {
    const { qualificationStatus, name, category, page = 1, pageSize = 20 } = query;
    const filter: any = {};
    if (qualificationStatus) filter.qualificationStatus = qualificationStatus;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (category) filter.category = category;

    const total = await SupplierModel.countDocuments(filter);
    const list = await SupplierModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    return {
      success: true,
      data: list as Supplier[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}

export async function getSupplier(id: string): Promise<ApiResponse<Supplier>> {
  try {
    const supplier = await SupplierModel.findOne({
      $or: [{ id }, { _id: id }]
    }).lean().exec();

    if (!supplier) {
      return { success: false, error: '供应商不存在' };
    }

    return { success: true, data: supplier as Supplier };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}

export async function getSupplierHistory(entityId: string) {
  return getChangeHistory('supplier', entityId);
}
