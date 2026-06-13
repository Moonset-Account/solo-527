import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateFollowUpTaskDto {
  @IsUUID()
  @IsNotEmpty({ message: '预约ID不能为空' })
  appointmentId: string;

  @IsUUID()
  @IsNotEmpty({ message: '患者ID不能为空' })
  patientId: string;

  @IsUUID()
  @IsNotEmpty({ message: '医生ID不能为空' })
  doctorId: string;

  @IsEnum(['phone', 'wechat', 'visit', 'other'], {
    message: '随访方式不正确',
  })
  @IsNotEmpty({ message: '随访方式不能为空' })
  type: string;

  @IsString()
  @IsNotEmpty({ message: '随访内容不能为空' })
  content: string;

  @IsDateString({}, { message: '计划随访日期格式不正确' })
  @IsNotEmpty({ message: '计划随访日期不能为空' })
  planDate: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateFollowUpTaskDto {
  @IsEnum(['pending', 'processing', 'completed', 'cancelled'], {
    message: '状态不正确',
  })
  @IsOptional()
  status?: string;

  @IsDateString({}, { message: '实际随访日期格式不正确' })
  @IsOptional()
  actualDate?: string;

  @IsString()
  @IsOptional()
  result?: string;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsEnum(['phone', 'wechat', 'visit', 'other'], {
    message: '随访方式不正确',
  })
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString({}, { message: '计划随访日期格式不正确' })
  @IsOptional()
  planDate?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}
