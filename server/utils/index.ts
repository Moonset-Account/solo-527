import dayjs from "dayjs";
import ChangeLog from "../models/ChangeLog.js";

export function generateOrderNo(prefix: string): string {
  const now = dayjs();
  const timestamp = now.format("YYYYMMDDHHmmss");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}${timestamp}${random}`;
}

interface CreateChangeLogOptions {
  module: string;
  action: string;
  targetId: any;
  targetType: string;
  targetNo?: string;
  targetName?: string;
  relatedDocId?: any;
  relatedDocType?: string;
  relatedDocNo?: string;
  beforeData?: any;
  afterData?: any;
  changes?: Array<{
    field: string;
    fieldLabel?: string;
    before?: any;
    after?: any;
  }>;
  operator: string;
  operatorRole?: string;
  remark?: string;
}

export async function createChangeLog(
  options: CreateChangeLogOptions
): Promise<void> {
  try {
    const logNo = generateOrderNo("LOG");
    const log = new ChangeLog({
      logNo,
      ...options,
    });
    await log.save();
  } catch (error) {
    console.error("创建变更日志失败:", error);
  }
}

export function compareObjects(
  before: Record<string, any>,
  after: Record<string, any>,
  labels: Record<string, string> = {}
): Array<{
  field: string;
  fieldLabel?: string;
  before?: any;
  after?: any;
}> {
  const changes: Array<{
    field: string;
    fieldLabel?: string;
    before?: any;
    after?: any;
  }> = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (
      ["_id", "createdAt", "updatedAt", "__v", "changeHistory"].includes(key)
    ) {
      continue;
    }
    const beforeVal = JSON.stringify(before[key]);
    const afterVal = JSON.stringify(after[key]);
    if (beforeVal !== afterVal) {
      changes.push({
        field: key,
        fieldLabel: labels[key] || key,
        before: before[key],
        after: after[key],
      });
    }
  }

  return changes;
}

export function successResponse(data: any, message = "操作成功") {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message: string, code = 400) {
  return {
    success: false,
    message,
    code,
  };
}

export function pagination(query: any) {
  const page = parseInt(query.page as string) || 1;
  const pageSize = parseInt(query.pageSize as string) || 20;
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}
