import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class UpdateFollowupDto {
  @IsEnum(['phone', 'wechat', 'visit'])
  @IsOptional()
  type?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

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
