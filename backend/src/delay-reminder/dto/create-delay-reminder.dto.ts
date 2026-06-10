import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { DelayReminderStatus } from '../../common/enums/delay-reminder-status.enum';

export class CreateDelayReminderDto {
  @IsNumber()
  projectId: number;

  @IsNumber()
  @IsOptional()
  stageId?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @IsOptional()
  days?: number;

  @IsString()
  @IsOptional()
  handler?: string;

  @IsEnum(DelayReminderStatus)
  @IsOptional()
  status?: DelayReminderStatus;
}
