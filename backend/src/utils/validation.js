const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

const userSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  password: z.string().min(6, '密码至少6个字符').optional(),
  name: z.string().min(1, '姓名不能为空'),
  role: z.enum(['ADMIN', 'WORKSHOP_DIRECTOR']),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const equipmentSchema = z.object({
  code: z.string().min(1, '设备编码不能为空'),
  name: z.string().min(1, '设备名称不能为空'),
  model: z.string().optional(),
  status: z.enum(['IDLE', 'RUNNING', 'MAINTENANCE', 'ERROR']).default('IDLE'),
  qrCode: z.string().min(1, '二维码不能为空'),
  location: z.string().optional(),
  description: z.string().optional(),
});

const processSchema = z.object({
  code: z.string().min(1, '工序编码不能为空'),
  name: z.string().min(1, '工序名称不能为空'),
  sequence: z.number().int().min(1, '序号必须大于0'),
  description: z.string().optional(),
});

const workOrderSchema = z.object({
  orderNo: z.string().min(1, '工单号不能为空'),
  productName: z.string().min(1, '产品名称不能为空'),
  productCode: z.string().min(1, '产品编码不能为空'),
  quantity: z.number().int().min(1, '数量必须大于0'),
  plannedDate: z.coerce.date(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  materialReady: z.boolean().default(false),
});

const productionPlanSchema = z.object({
  planNo: z.string().min(1, '计划编号不能为空'),
  workOrderId: z.number().int().min(1, '工单ID不能为空'),
  equipmentId: z.number().int().min(1, '设备ID不能为空'),
  plannedStart: z.coerce.date(),
  plannedEnd: z.coerce.date(),
  priority: z.number().int().min(1).default(1),
  remark: z.string().optional(),
});

const processFlowSchema = z.object({
  planId: z.number().int().min(1, '计划ID不能为空'),
  equipmentId: z.number().int().min(1, '设备ID不能为空'),
  processId: z.number().int().min(1, '工序ID不能为空'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REWORK', 'SKIPPED']).default('PENDING'),
  operator: z.string().optional(),
  outputQuantity: z.number().int().min(0).default(0),
  defectQuantity: z.number().int().min(0).default(0),
  remark: z.string().optional(),
});

const reworkSchema = z.object({
  processFlowId: z.number().int().min(1, '工序流转ID不能为空'),
  reason: z.string().min(1, '返工原因不能为空'),
  description: z.string().optional(),
  quantity: z.number().int().min(1, '返工数量必须大于0'),
  remark: z.string().optional(),
});

const materialCheckSchema = z.object({
  workOrderId: z.number().int().min(1, '工单ID不能为空'),
  materialName: z.string().min(1, '物料名称不能为空'),
  materialCode: z.string().min(1, '物料编码不能为空'),
  requiredQty: z.number().int().min(1, '需求数量必须大于0'),
  availableQty: z.number().int().min(0, '可用数量不能为负'),
  remark: z.string().optional(),
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginSchema,
  userSchema,
  equipmentSchema,
  processSchema,
  workOrderSchema,
  productionPlanSchema,
  processFlowSchema,
  reworkSchema,
  materialCheckSchema,
  validate,
};
