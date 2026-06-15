import { z } from 'zod';

export const petSchema = z.object({
  name: z.string().min(1, '宠物名称必填'),
  species: z.string().min(1, '物种必填'),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  birthDate: z.string().optional(),
  weight: z.number().optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  vaccineRecord: z.string().optional(),
  allergies: z.string().optional(),
  specialNeeds: z.string().optional(),
  riskReason: z.string().optional(),
  riskLevel: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  status: z.enum(['active', 'inactive', 'adopted']).default('active'),
});

export const petUpdateSchema = petSchema.partial();

export const fosteringRecordSchema = z.object({
  petId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
  notes: z.string().optional(),
});

export const healthRecordSchema = z.object({
  petId: z.string().uuid(),
  fosteringRecordId: z.string().uuid().optional(),
  recordType: z.string(),
  description: z.string(),
  treatment: z.string().optional(),
  temperature: z.string().optional(),
  heartRate: z.number().optional(),
  respiratoryRate: z.number().optional(),
  recordedBy: z.string().optional(),
});

export const photoSchema = z.object({
  petId: z.string().uuid(),
  fosteringRecordId: z.string().uuid().optional(),
  photoType: z.string(),
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  description: z.string().optional(),
  uploadedBy: z.string().optional(),
});

export const revisitPlanSchema = z.object({
  petId: z.string().uuid(),
  fosteringRecordId: z.string().uuid().optional(),
  planDate: z.string(),
  planType: z.string(),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
});

export const vaccineAllergySchema = z.object({
  petId: z.string().uuid(),
  type: z.enum(['vaccine', 'allergy']),
  name: z.string(),
  date: z.string().optional(),
  reaction: z.string().optional(),
  notes: z.string().optional(),
});

export const volunteerSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  skills: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const scheduleSchema = z.object({
  volunteerId: z.string().uuid(),
  petId: z.string().uuid().optional(),
  fosteringRecordId: z.string().uuid().optional(),
  scheduleDate: z.string(),
  shiftType: z.string().optional(),
  taskDescription: z.string().optional(),
  riskReason: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
});

export const receiptSchema = z.object({
  receiptNo: z.string(),
  petId: z.string().uuid(),
  fosteringRecordId: z.string().uuid().optional(),
  receiptType: z.string(),
  amount: z.number().optional(),
  status: z.enum(['draft', 'pending', 'paid', 'cancelled']).default('draft'),
});

export const attachmentSchema = z.object({
  receiptId: z.string().uuid(),
  fileName: z.string(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  url: z.string().url(),
  uploadedBy: z.string().optional(),
});

export const noteSchema = z.object({
  receiptId: z.string().uuid(),
  content: z.string(),
  createdBy: z.string().optional(),
});

export const callbackSchema = z.object({
  receiptId: z.string().uuid().optional(),
  callbackType: z.string(),
  callbackUrl: z.string().url(),
  payload: z.any().optional(),
  status: z.enum(['pending', 'success', 'failed', 'retrying']).default('pending'),
});

export const callbackRetrySchema = z.object({
  callbackUrl: z.string().url().optional(),
  payload: z.any().optional(),
});
