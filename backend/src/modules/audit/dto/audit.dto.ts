import { IsString, IsOptional, IsEnum, IsObject, IsDateString } from 'class-validator';
import { AuditAction } from '@/common/enums/index.enum';

export class CreateAuditLogDto {
  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  module: string;

  @IsString()
  targetId: string;

  @IsOptional()
  @IsString()
  targetName?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryAuditDto {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
