import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFollowupDto {
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @IsEnum(['phone', 'wechat', 'visit'])
  @IsNotEmpty()
  type: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsString()
  @IsOptional()
  result?: string;

  @IsDateString()
  @IsOptional()
  nextFollowupAt?: string;
}
