import { IsString, IsOptional } from 'class-validator';

export class ResolveDelayReminderDto {
  @IsString()
  @IsOptional()
  handler?: string;
}
