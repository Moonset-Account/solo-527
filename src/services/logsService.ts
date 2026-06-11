import { createClient } from "@/utils/supabase/server";
import type { OperationLog, OperationLogType } from "@/types";

export interface LogsQueryParams {
  type?: OperationLogType;
  startTime?: Date;
  endTime?: Date;
  assignee?: string;
  page?: number;
  pageSize?: number;
}

export interface LogsResult {
  data: OperationLog[];
  total: number;
}

function dbLogToLog(dbLog: any): OperationLog {
  return {
    id: dbLog.id,
    userId: dbLog.user_id,
    operatorName: dbLog.operator_name,
    operatorRole: dbLog.operator_role,
    action: dbLog.action,
    type: dbLog.type as OperationLogType,
    targetId: dbLog.target_id,
    details: dbLog.details,
    orderNo: dbLog.order_no,
    ipAddress: dbLog.ip_address,
    timestamp: new Date(dbLog.timestamp),
  };
}

export async function getOperationLogs(params: LogsQueryParams = {}): Promise<LogsResult> {
  const supabase = createClient() as any;
  let query = supabase.from("operation_logs").select("*", { count: "exact" });

  if (params.type) {
    query = query.eq("type", params.type);
  }

  if (params.startTime) {
    query = query.gte("timestamp", params.startTime.toISOString());
  }

  if (params.endTime) {
    query = query.lte("timestamp", params.endTime.toISOString());
  }

  if (params.assignee) {
    query = query.ilike("operator_name", `%${params.assignee}%`);
  }

  if (params.page && params.pageSize) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);
  }

  query = query.order("timestamp", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching operation logs:", error);
    return { data: [], total: 0 };
  }

  return {
    data: data?.map(dbLogToLog) || [],
    total: count || 0,
  };
}

export async function createOperationLog(
  log: Omit<OperationLog, "id" | "timestamp">
): Promise<boolean> {
  const supabase = createClient() as any;
  const { error } = await supabase.from("operation_logs").insert({
    user_id: log.userId,
    operator_name: log.operatorName,
    operator_role: log.operatorRole,
    action: log.action,
    type: log.type,
    target_id: log.targetId,
    details: log.details,
    order_no: log.orderNo,
    ip_address: log.ipAddress,
  });

  if (error) {
    console.error("Error creating operation log:", error);
    return false;
  }

  return true;
}
