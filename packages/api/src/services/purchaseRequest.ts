import { nanoid } from 'nanoid';
import { PurchaseRequestModel } from '../models/PurchaseRequest.js';
import { 
  PurchaseRequest, 
  MaterialItem, 
  Attachment, 
  PurchaseStatus,
  ApiResponse 
} from '@app/shared';
import { createChangeHistory, getChangeHistory } from './changeTracker.js';

function generatePRCode(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `PR-${ymd}-${nanoid(6).toUpperCase()}`;
}

export async function createPurchaseRequest(
  data: Partial<PurchaseRequest>,
  userId: string,
  userName: string
): Promise<ApiResponse<PurchaseRequest>> {
  try {
    const code = generatePRCode();
    const items: MaterialItem[] = (data.items || []).map(item => ({
      ...item,
      id: nanoid(12)
    }));
    
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.budgetPrice ? item.budgetPrice * item.quantity : 0);
    }, 0);

    const pr = await PurchaseRequestModel.create({
      id: nanoid(16),
      code,
      projectName: data.projectName,
      projectCode: data.projectCode,
      projectManagerId: userId,
      projectManagerName: userName,
      department: data.department || '未分配',
      items,
      attachments: data.attachments || [],
      requiredDate: data.requiredDate,
      description: data.description,
      status: 'draft' as PurchaseStatus,
      currentQuoteCount: 0,
      totalAmount: totalAmount > 0 ? totalAmount : undefined,
    });

    return {
      success: true,
      data: pr.toObject() as PurchaseRequest,
      message: '采购需求已创建'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建失败'
    };
  }
}

export async function updatePurchaseRequest(
  id: string,
  data: Partial<PurchaseRequest>,
  userId: string,
  userName: string,
  changeReason?: string
): Promise<ApiResponse<PurchaseRequest>> {
  try {
    const oldPR = await PurchaseRequestModel.findOne({ 
      $or: [{ id }, { _id: id }] 
    }).lean().exec();
    
    if (!oldPR) {
      return { success: false, error: '采购需求不存在' };
    }

    const updateData: any = { ...data };
    if (data.items) {
      updateData.items = data.items.map((item, idx) => ({
        ...item,
        id: item.id || nanoid(12)
      }));
      
      updateData.totalAmount = updateData.items.reduce((sum: number, item: MaterialItem) => {
        return sum + (item.budgetPrice ? item.budgetPrice * item.quantity : 0);
      }, 0);
    }

    const updatedPR = await PurchaseRequestModel.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      { $set: updateData },
      { new: true }
    ).lean().exec();

    await createChangeHistory(
      'purchase_request',
      oldPR.id || String((oldPR as any)._id),
      oldPR.code,
      oldPR,
      updatedPR,
      userId,
      userName,
      changeReason
    );

    return {
      success: true,
      data: updatedPR as PurchaseRequest,
      message: '采购需求已更新'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失败'
    };
  }
}

export async function submitPurchaseRequest(
  id: string,
  userId: string,
  userName: string
): Promise<ApiResponse<PurchaseRequest>> {
  return updatePurchaseRequest(
    id,
    { status: 'submitted' as PurchaseStatus, submittedAt: new Date() },
    userId,
    userName,
    '提交采购需求'
  );
}

export async function getPurchaseRequest(
  id: string
): Promise<ApiResponse<PurchaseRequest>> {
  try {
    const pr = await PurchaseRequestModel.findOne({ 
      $or: [{ id }, { _id: id }] 
    }).lean().exec();
    
    if (!pr) {
      return { success: false, error: '采购需求不存在' };
    }

    return {
      success: true,
      data: pr as PurchaseRequest
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}

export async function listPurchaseRequests(
  query: {
    status?: PurchaseStatus;
    projectName?: string;
    projectManagerId?: string;
    department?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ApiResponse<PurchaseRequest[]>> {
  try {
    const {
      status,
      projectName,
      projectManagerId,
      department,
      page = 1,
      pageSize = 20
    } = query;

    const filter: any = {};
    if (status) filter.status = status;
    if (projectManagerId) filter.projectManagerId = projectManagerId;
    if (department) filter.department = department;
    if (projectName) filter.projectName = { $regex: projectName, $options: 'i' };

    const total = await PurchaseRequestModel.countDocuments(filter);
    const list = await PurchaseRequestModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    return {
      success: true,
      data: list as PurchaseRequest[],
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

export async function getPurchaseRequestHistory(entityId: string) {
  return getChangeHistory('purchase_request', entityId);
}
