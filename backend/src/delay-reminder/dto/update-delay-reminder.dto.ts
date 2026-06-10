import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DelayReminderStatus } from '../../common/enums/delay-reminder-status.enum';

export class UpdateDelayReminderDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  handler?: string;

  @IsEnum(DelayReminderStatus)
  @IsOptional()
  status?: DelayReminderStatus;
}
