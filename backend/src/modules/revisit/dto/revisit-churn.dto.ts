import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';

export class CreateRevisitChurnDto {
  @IsUUID()
  @IsNotEmpty({ message: '患者ID不能为空' })
  patientId: string;

  @IsUUID()
  @IsOptional()
  lastAppointmentId?: string;

  @IsDateString({}, { message: '最后就诊日期格式不正确' })
  @IsOptional()
  lastVisitDate?: string;

  @IsDateString({}, { message: '计划复诊日期格式不正确' })
  @IsOptional()
  plannedRevisitDate?: string;

  @IsEnum(['no_show', 'cancelled', 'lost', 'other'], {
    message: '流失类型不正确',
  })
  @IsOptional()
  churnType?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateRevisitChurnDto {
  @IsEnum(['pending', 'processing', 'completed', 'cancelled'], {
    message: '状态不正确',
  })
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  handleResult?: string;

  @IsString()
  @IsOptional()
  handleNotes?: string;

  @IsUUID()
  @IsOptional()
  handlerId?: string;

  @IsDateString({}, { message: '处理时间格式不正确' })
  @IsOptional()
  handledAt?: string;

  @IsEnum(['no_show', 'cancelled', 'lost', 'other'], {
    message: '流失类型不正确',
  })
  @IsOptional()
  churnType?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

export class CloseRevisitChurnDto {
  @IsString()
  @IsNotEmpty({ message: '处理结果不能为空' })
  handleResult: string;

  @IsString()
  @IsOptional()
  handleNotes?: string;

  @IsBoolean()
  @IsOptional()
  backfillToChargeAccuracy?: boolean;
}
