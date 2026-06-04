import { z } from "zod";
import { MachineryType } from "@/lib/types";

export const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(6, "密码至少6位"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "用户名至少3位"),
  password: z.string().min(6, "密码至少6位"),
  realName: z.string().min(1, "真实姓名不能为空"),
  phone: z.string().optional(),
  village: z.string().optional(),
});

export const createReservationSchema = z.object({
  fieldId: z.number().int().positive("请选择作业地块"),
  operationType: z.nativeEnum(MachineryType, {
    errorMap: () => ({ message: "请选择作业类型" }),
  }),
  scheduledDate: z.string().min(1, "请选择作业日期"),
  area: z.number().positive("作业面积必须大于0"),
  pricePerMu: z.number().positive("每亩价格必须大于0"),
  village: z.string().min(1, "请选择所属村庄"),
  contactName: z.string().min(1, "联系人姓名不能为空"),
  contactPhone: z.string().min(11, "联系电话格式不正确"),
  contractId: z.number().int().optional(),
  remarks: z.string().optional(),
});

export const createDispatchSchema = z.object({
  reservationId: z.number().int().positive("请选择作业预约"),
  machineryId: z.number().int().positive("请选择农机"),
  driverId: z.number().int().positive("请选择司机"),
  route: z.string().optional(),
  remarks: z.string().optional(),
});

export const createFuelSchema = z.object({
  dispatchId: z.number().int().optional(),
  machineryId: z.number().int().positive("请选择农机"),
  fuelAmount: z.number().positive("加油量必须大于0"),
  fuelPrice: z.number().positive("油价必须大于0"),
  fillDate: z.string().min(1, "请选择加油日期"),
  odometer: z.number().optional(),
  remarks: z.string().optional(),
});

export const createMaintenanceSchema = z.object({
  machineryId: z.number().int().positive("请选择农机"),
  title: z.string().min(1, "请输入维修标题"),
  description: z.string().min(1, "请输入维修描述"),
  reportedDate: z.string().min(1, "请选择上报日期"),
  cost: z.number().optional(),
  parts: z.string().optional(),
  remarks: z.string().optional(),
});

export const batchRescheduleSchema = z.object({
  date: z.string().min(1, "请选择需要改期的日期"),
  village: z.string().optional(),
  newDate: z.string().min(1, "请选择新的作业日期"),
  reason: z.string().min(1, "请说明改期原因"),
});

export const approveReservationSchema = z.object({
  remarks: z.string().optional(),
});

export const rejectReservationSchema = z.object({
  reason: z.string().min(1, "请说明拒绝原因"),
});

export const withdrawReservationSchema = z.object({
  reason: z.string().min(1, "请说明撤回原因"),
});

export const settlementSchema = z.object({
  actualArea: z.number().positive("实际作业面积必须大于0"),
  fuelCost: z.number().default(0),
  maintenanceCost: z.number().default(0),
  otherCost: z.number().default(0),
  remarks: z.string().optional(),
});

export const savedFilterSchema = z.object({
  pageName: z.string().min(1, "页面名称不能为空"),
  filterName: z.string().min(1, "筛选条件名称不能为空"),
  filterData: z.record(z.any()),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
  errors?: z.ZodIssue[];
} {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues;
    const message = errors.map((e) => e.message).join("; ");
    return { success: false, error: message, errors };
  }
  return { success: true, data: result.data };
}
