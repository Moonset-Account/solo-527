import { nanoid } from 'nanoid';
import { FrameworkAgreementModel } from '../models/FrameworkAgreement.js';
import {
  FrameworkAgreement,
  AgreementStatus,
  ApiResponse
} from '@app/shared';
import { createChangeHistory, getChangeHistory } from './changeTracker.js';
import { getRedisClient, CACHE_KEYS, CACHE_TTL } from '../config/redis.js';

function generateAgreementCode(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `FA-${ymd}-${nanoid(6).toUpperCase()}`;
}

export async function createFrameworkAgreement(
  data: Partial<FrameworkAgreement>,
  userId: string,
  userName: string
): Promise<ApiResponse<FrameworkAgreement>> {
  try {
    const code = generateAgreementCode();
    const agreement = await FrameworkAgreementModel.create({
      id: nanoid(16),
      code,
      name: data.name,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      items: data.items || [],
      startDate: data.startDate,
      endDate: data.endDate,
      totalAmount: data.totalAmount,
      status: 'active' as AgreementStatus,
      attachments: data.attachments || [],
      terms: data.terms
    });

    return {
      success: true,
      data: agreement.toObject() as FrameworkAgreement,
      message: '框架协议已创建'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建失败'
    };
  }
}

export async function updateFrameworkAgreement(
  id: string,
  data: Partial<FrameworkAgreement>,
  userId: string,
  userName: string,
  changeReason?: string
): Promise<ApiResponse<FrameworkAgreement>> {
  try {
    const oldAgreement = await FrameworkAgreementModel.findOne({
      $or: [{ id }, { _id: id }]
    }).lean().exec();

    if (!oldAgreement) {
      return { success: false, error: '协议不存在' };
    }

    const updatedAgreement = await FrameworkAgreementModel.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      { $set: data },
      { new: true }
    ).lean().exec();

    await createChangeHistory(
      'agreement',
      (oldAgreement as any).id || String((oldAgreement as any)._id),
      (oldAgreement as any).code,
      oldAgreement,
      updatedAgreement,
      userId,
      userName,
      changeReason
    );

    const redis = getRedisClient();
    redis.del(`${CACHE_KEYS.MATERIAL_PRICE_TREND}*`);

    return {
      success: true,
      data: updatedAgreement as FrameworkAgreement,
      message: '协议已更新'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失败'
    };
  }
}

export async function listFrameworkAgreements(
  query: {
    status?: AgreementStatus;
    supplierId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ApiResponse<FrameworkAgreement[]>> {
  try {
    const { status, supplierId, page = 1, pageSize = 20 } = query;
    const filter: any = {};
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;

    const total = await FrameworkAgreementModel.countDocuments(filter);
    const list = await FrameworkAgreementModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    return {
      success: true,
      data: list as FrameworkAgreement[],
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

export async function getFrameworkAgreement(id: string): Promise<ApiResponse<FrameworkAgreement>> {
  try {
    const agreement = await FrameworkAgreementModel.findOne({
      $or: [{ id }, { _id: id }]
    }).lean().exec();

    if (!agreement) {
      return { success: false, error: '协议不存在' };
    }

    return { success: true, data: agreement as FrameworkAgreement };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}

export async function getAgreementHistory(entityId: string) {
  return getChangeHistory('agreement', entityId);
}

export async function getDocumentVersionDiff(
  entityType: 'purchase_request' | 'quote' | 'agreement',
  entityId: string
): Promise<ApiResponse<any>> {
  try {
    const history = await getChangeHistory(entityType, entityId);

    let document: any = null;
    let docCode = '';

    if (entityType === 'purchase_request') {
      const { PurchaseRequestModel } = await import('../models/PurchaseRequest.js');
      document = await PurchaseRequestModel.findOne({ $or: [{ id: entityId }, { _id: entityId }] }).lean().exec();
      docCode = (document as any)?.code || '';
    } else if (entityType === 'quote') {
      const { QuoteModel } = await import('../models/Quote.js');
      document = await QuoteModel.findOne({ $or: [{ id: entityId }, { _id: entityId }] }).lean().exec();
      docCode = (document as any)?.code || '';
    } else {
      const { FrameworkAgreementModel } = await import('../models/FrameworkAgreement.js');
      document = await FrameworkAgreementModel.findOne({ $or: [{ id: entityId }, { _id: entityId }] }).lean().exec();
      docCode = (document as any)?.code || '';
    }

    return {
      success: true,
      data: {
        document,
        docCode,
        changeHistory: history,
        versionCount: history.length + 1
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}
