import { db } from './index';
import { operationHistory } from './schema';

type AddHistoryParams = {
  operatorName: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
  metadata?: Record<string, unknown>;
};

export async function addHistory(params: AddHistoryParams) {
  await db.insert(operationHistory).values({
    operatorName: params.operatorName,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    detail: params.detail,
    metadata: params.metadata
  });
}
