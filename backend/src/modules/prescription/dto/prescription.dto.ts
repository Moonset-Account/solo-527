import { IsString, IsNotEmpty, IsUUID, IsArray, ArrayNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class PrescriptionItemDto {
  @IsUUID()
  @IsNotEmpty({ message: '收费项目ID不能为空' })
  chargeItemId: string;

  @IsNumber()
  @IsNotEmpty({ message: '数量不能为空' })
  quantity: number;

  @IsNumber()
  @IsNotEmpty({ message: '单价不能为空' })
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsNotEmpty({ message: '实收金额不能为空' })
  actualPrice: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreatePrescriptionDto {
  @IsUUID()
  @IsNotEmpty({ message: '预约ID不能为空' })
  appointmentId: string;

  @IsUUID()
  @IsNotEmpty({ message: '患者ID不能为空' })
  patientId: string;

  @IsUUID()
  @IsNotEmpty({ message: '医生ID不能为空' })
  doctorId: string;

  @IsString()
  @IsNotEmpty({ message: '诊断不能为空' })
  diagnosis: string;

  @IsString()
  @IsOptional()
  treatmentPlan?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayNotEmpty({ message: '处方项目不能为空' })
  items: PrescriptionItemDto[];
}

export class UpdatePrescriptionDto {
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  treatmentPlan?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  items?: PrescriptionItemDto[];

  @IsString()
  @IsOptional()
  status?: string;
}
