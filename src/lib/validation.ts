import { z } from "zod";
import { parseISO, isValid, differenceInMinutes } from "date-fns";

export const visitProcessSchema = z.object({
  visitNumber: z.string().min(1, "就诊号不能为空"),
  patientTypeId: z.string().nullable(),
  deptId: z.string().min(1, "科室不能为空"),
  doctorId: z.string().nullable(),
  registerTime: z.string().nullable(),
  checkinTime: z.string().nullable(),
  triageTime: z.string().nullable(),
  callTime: z.string().nullable(),
  paymentTime: z.string().nullable(),
  medicineTime: z.string().nullable(),
});

export type VisitProcessInput = z.infer<typeof visitProcessSchema>;

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateTimestampOrder(
  data: Partial<VisitProcessInput>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const timestamps: Array<{ name: string; value: string | null | undefined }> = [
    { name: "挂号时间", value: data.registerTime },
    { name: "签到时间", value: data.checkinTime },
    { name: "分诊时间", value: data.triageTime },
    { name: "叫号时间", value: data.callTime },
    { name: "缴费时间", value: data.paymentTime },
    { name: "取药时间", value: data.medicineTime },
  ];

  for (let i = 0; i < timestamps.length - 1; i++) {
    for (let j = i + 1; j < timestamps.length; j++) {
      const earlier = timestamps[i];
      const later = timestamps[j];
      
      if (earlier.value && later.value) {
        const earlierDate = parseISO(earlier.value);
        const laterDate = parseISO(later.value);
        
        if (isValid(earlierDate) && isValid(laterDate) && earlierDate > laterDate) {
          errors.push({
            row: 0,
            field: `${earlier.name}/${later.name}`,
            message: `${earlier.name} 不能晚于 ${later.name}`,
            value: `${earlier.value} / ${later.value}`,
          });
        }
      }
    }
  }

  return errors;
}

export function validateWaitTimes(data: Partial<VisitProcessInput>): ValidationError[] {
  const warnings: ValidationError[] = [];

  const calcWait = (start: string | null | undefined, end: string | null | undefined): number | null => {
    if (!start || !end) return null;
    const s = parseISO(start);
    const e = parseISO(end);
    if (!isValid(s) || !isValid(e)) return null;
    return differenceInMinutes(e, s);
  };

  const totalWait = calcWait(data.registerTime, data.medicineTime);
  if (totalWait !== null && totalWait > 1440) {
    warnings.push({
      row: 0,
      field: "总等待时长",
      message: "总等待时长超过24小时，可能存在异常",
      value: `${totalWait}分钟`,
    });
  }

  const doctorWait = calcWait(data.triageTime, data.callTime);
  if (doctorWait !== null && doctorWait > 480) {
    warnings.push({
      row: 0,
      field: "就诊等待时长",
      message: "就诊等待超过8小时，可能存在异常",
      value: `${doctorWait}分钟`,
    });
  }

  return warnings;
}

export function validateVisitData(
  data: Partial<VisitProcessInput>,
  rowIndex = 0
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!data.deptId) {
    errors.push({
      row: rowIndex,
      field: "科室",
      message: "科室ID不能为空",
      value: data.deptId || "",
    });
  }

  if (!data.visitNumber) {
    errors.push({
      row: rowIndex,
      field: "就诊号",
      message: "就诊号不能为空",
      value: data.visitNumber || "",
    });
  }

  const timestampFields = [
    "registerTime",
    "checkinTime",
    "triageTime",
    "callTime",
    "paymentTime",
    "medicineTime",
  ];

  timestampFields.forEach((field) => {
    const value = data[field as keyof VisitProcessInput];
    if (value) {
      const parsed = parseISO(value as string);
      if (!isValid(parsed)) {
        errors.push({
          row: rowIndex,
          field,
          message: "日期时间格式不正确，应为 ISO 8601 格式",
          value: value as string,
        });
      }
    }
  });

  errors.push(...validateTimestampOrder(data).map((e) => ({ ...e, row: rowIndex })));
  warnings.push(...validateWaitTimes(data).map((w) => ({ ...w, row: rowIndex })));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function cleanAndCalculateWaitTimes(data: any) {
  const parseTime = (t: string | null): Date | null => {
    if (!t) return null;
    const parsed = parseISO(t);
    return isValid(parsed) ? parsed : null;
  };

  const registerDate = parseTime(data.registerTime);
  const checkinDate = parseTime(data.checkinTime);
  const triageDate = parseTime(data.triageTime);
  const callDate = parseTime(data.callTime);
  const paymentDate = parseTime(data.paymentTime);
  const medicineDate = parseTime(data.medicineTime);

  const calcMin = (start: Date | null, end: Date | null): number | null => {
    if (!start || !end) return null;
    const diff = differenceInMinutes(end, start);
    return diff >= 0 ? diff : null;
  };

  return {
    ...data,
    visitDate: registerDate
      ? registerDate.toISOString().split("T")[0]
      : checkinDate
      ? checkinDate.toISOString().split("T")[0]
      : null,
    waitRegisterMinutes: calcMin(registerDate, checkinDate),
    waitTriageMinutes: calcMin(checkinDate, triageDate),
    waitDoctorMinutes: calcMin(triageDate, callDate),
    waitPaymentMinutes: calcMin(callDate, paymentDate),
    waitMedicineMinutes: calcMin(paymentDate, medicineDate),
    waitTotalMinutes: calcMin(registerDate, medicineDate),
    dayOfWeek: registerDate ? registerDate.getDay() : null,
    hourOfDay: registerDate ? registerDate.getHours() : null,
  };
}

export function maskVisitNumber(visitNumber: string): string {
  if (!visitNumber) return "";
  if (visitNumber.length <= 4) return "***";
  const prefix = visitNumber.slice(0, 2);
  const suffix = visitNumber.slice(-2);
  return `${prefix}***${suffix}`;
}
