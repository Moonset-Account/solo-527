import type { ReturnRecord } from "./types";

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: {
    type: "error" | "warning" | "info";
    field: string;
    message: string;
    count: number;
  }[];
}

export function validateRecords(records: ReturnRecord[]): ValidationResult {
  const issues: ValidationResult["issues"] = [];

  const missingRefundTime = records.filter((r) => !r.refundTime).length;
  if (missingRefundTime > 0) {
    issues.push({
      type: "warning",
      field: "refundTime",
      message: "退款时间缺失",
      count: missingRefundTime,
    });
  }

  const missingQualityTime = records.filter((r) => !r.qualityTime).length;
  if (missingQualityTime > 0) {
    issues.push({
      type: "warning",
      field: "qualityTime",
      message: "质检时间缺失",
      count: missingQualityTime,
    });
  }

  const negativeCycle = records.filter((r) => r.refundCycle < 0).length;
  if (negativeCycle > 0) {
    issues.push({
      type: "error",
      field: "refundCycle",
      message: "退款周期为负值",
      count: negativeCycle,
    });
  }

  const longCycle = records.filter((r) => r.refundCycle > 60).length;
  if (longCycle > 0) {
    issues.push({
      type: "info",
      field: "refundCycle",
      message: "退款周期超过60天（异常值）",
      count: longCycle,
    });
  }

  const missingAgent = records.filter((r) => !r.agentId).length;
  if (missingAgent > 0) {
    issues.push({
      type: "warning",
      field: "agentId",
      message: "客服工号缺失",
      count: missingAgent,
    });
  }

  const duplicateReturnIds = new Set(records.map((r) => r.returnId));
  if (duplicateReturnIds.size !== records.length) {
    issues.push({
      type: "error",
      field: "returnId",
      message: "存在重复退货单号",
      count: records.length - duplicateReturnIds.size,
    });
  }

  const errorCount = issues.filter((i) => i.type === "error").length;
  const warningCount = issues.filter((i) => i.type === "warning").length;
  const score = Math.max(
    0,
    100 - errorCount * 20 - warningCount * 5
  );

  return {
    isValid: errorCount === 0,
    score,
    issues,
  };
}

export function checkSampleSizeSignificance(sampleSize: number): {
  level: "low" | "medium" | "high";
  message: string;
} {
  if (sampleSize < 30) {
    return {
      level: "low",
      message: "样本量较小，统计结论仅供参考",
    };
  }
  if (sampleSize < 100) {
    return {
      level: "medium",
      message: "样本量适中，结论有一定参考价值",
    };
  }
  return {
    level: "high",
    message: "样本量充足，结论可信度高",
  };
}
