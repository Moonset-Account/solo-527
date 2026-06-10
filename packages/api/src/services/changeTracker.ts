import { nanoid } from 'nanoid';
import { ChangeHistoryModel } from '../models/ChangeHistory.js';
import { 
  ChangeEntity, 
  FieldChange, 
  PurchaseRequest, 
  Quote, 
  Supplier, 
  FrameworkAgreement 
} from '@app/shared';

const FIELD_LABELS: Record<string, Record<string, string>> = {
  purchase_request: {
    'status': '采购状态',
    'projectName': '项目名称',
    'requiredDate': '需求日期',
    'description': '需求描述',
    'totalAmount': '总金额',
    'items': '采购明细',
    'items.$.quantity': '采购数量',
    'items.$.budgetPrice': '预算单价',
    'selectedQuoteId': '中标报价',
  },
  quote: {
    'status': '报价状态',
    'totalAmount': '报价总额',
    'items': '报价明细',
    'items.$.unitPrice': '单价',
    'paymentTerms': '付款条款',
    'deliveryTerms': '交货条款',
    'validityDate': '有效期',
    'remark': '备注',
  },
  supplier: {
    'qualificationStatus': '资质状态',
    'contactPerson': '联系人',
    'address': '地址',
    'rating': '评级',
    'qualifications': '资质文件',
    'tags': '标签',
  },
  agreement: {
    'status': '协议状态',
    'items': '协议明细',
    'startDate': '开始日期',
    'endDate': '结束日期',
    'totalAmount': '协议总额',
    'terms': '协议条款',
  },
};

const KEY_FIELDS: Record<string, string[]> = {
  purchase_request: ['status', 'requiredDate', 'totalAmount', 'items', 'selectedQuoteId'],
  quote: ['status', 'totalAmount', 'items', 'paymentTerms', 'validityDate'],
  supplier: ['qualificationStatus', 'contactPerson', 'rating', 'qualifications'],
  agreement: ['status', 'items', 'startDate', 'endDate', 'totalAmount'],
};

export function getFieldLabel(entityType: ChangeEntity, field: string): string {
  const labels = FIELD_LABELS[entityType] || {};
  return labels[field] || field;
}

export function isKeyField(entityType: ChangeEntity, field: string): boolean {
  const keys = KEY_FIELDS[entityType] || [];
  return keys.some(k => field === k || field.startsWith(k + '.'));
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => deepEqual(a[key], b[key]));
}

function detectChanges(
  entityType: ChangeEntity,
  oldData: any,
  newData: any,
  prefix = ''
): FieldChange[] {
  const changes: FieldChange[] = [];
  
  if (!oldData || !newData) return changes;
  
  const allKeys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {})
  ]);
  
  for (const key of allKeys) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldData?.[key];
    const newVal = newData?.[key];
    
    if (!deepEqual(oldVal, newVal)) {
      const fieldType: 'primitive' | 'array' | 'object' = 
        Array.isArray(oldVal) || Array.isArray(newVal) ? 'array' :
        typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null ? 'object' : 'primitive';
      
      if (fieldType === 'primitive') {
        changes.push({
          field: fullPath,
          fieldLabel: getFieldLabel(entityType, fullPath),
          oldValue: oldVal ?? null,
          newValue: newVal ?? null,
          type: 'primitive'
        });
      } else if (fieldType === 'array') {
        changes.push({
          field: fullPath,
          fieldLabel: getFieldLabel(entityType, fullPath),
          oldValue: oldVal ?? [],
          newValue: newVal ?? [],
          type: 'array'
        });
        
        const maxLen = Math.max(Array.isArray(oldVal) ? oldVal.length : 0, Array.isArray(newVal) ? newVal.length : 0);
        for (let i = 0; i < maxLen; i++) {
          const itemChanges = detectChanges(
            entityType,
            Array.isArray(oldVal) ? oldVal[i] : undefined,
            Array.isArray(newVal) ? newVal[i] : undefined,
            `${fullPath}.${i}`
          );
          changes.push(...itemChanges);
        }
      } else {
        changes.push({
          field: fullPath,
          fieldLabel: getFieldLabel(entityType, fullPath),
          oldValue: oldVal ?? {},
          newValue: newVal ?? {},
          type: 'object'
        });
      }
    }
  }
  
  return changes;
}

export async function createChangeHistory(
  entityType: ChangeEntity,
  entityId: string,
  entityCode: string,
  oldData: any,
  newData: any,
  changedBy: string,
  changedByName: string,
  changeReason?: string
): Promise<void> {
  const allChanges = detectChanges(entityType, oldData, newData);
  const keyChanges = allChanges.filter(c => isKeyField(entityType, c.field));
  
  if (keyChanges.length === 0) return;
  
  const history = await ChangeHistoryModel.create({
    id: nanoid(16),
    entityId,
    entityType,
    entityCode,
    changes: keyChanges,
    changedBy,
    changedByName,
    changeReason
  });
  
  console.log(`📝 Change history created: ${entityType}:${entityCode} - ${keyChanges.length} key fields changed`);
}

export async function getChangeHistory(
  entityType: ChangeEntity,
  entityId: string,
  limit = 50
) {
  return ChangeHistoryModel
    .find({ entityType, entityId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
}
