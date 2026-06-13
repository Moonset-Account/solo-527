import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateReminderTaskDto {
  @IsEnum(['appointment', 'prescription', 'follow_up', 'revisit'], {
    message: '类型不正确',
  })
  @IsNotEmpty({ message: '类型不能为空' })
  type: string;

  @IsUUID()
  @IsNotEmpty({ message: '关联ID不能为空' })
  relatedId: string;

  @IsUUID()
  @IsNotEmpty({ message: '患者ID不能为空' })
  patientId: string;

  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(['low', 'normal', 'high', 'urgent'], {
    message: '优先级不正确',
  })
  @IsOptional()
  priority?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @IsDateString({}, { message: '到期时间格式不正确' })
  @IsOptional()
  dueDate?: string;
}

export class UpdateReminderTaskDto {
  @IsEnum(['pending', 'processing', 'completed', 'cancelled'], {
    message: '状态不正确',
  })
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  result?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
