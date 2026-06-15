import { IsString, IsUUID, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';

export type EntityType = 'bill' | 'collection_rhythm' | 'collection_record' | 'invoice' | 'attachment' | 'reconciliation' | 'cash_forecast' | 'customer' | 'subscription' | 'export_queue';

export type ActionType = 'create' | 'update' | 'delete' | 'update_status' | 'record_payment' | 'export' | 'import' | 'login' | 'logout';

export class CreateAuditLogDto {
  @IsEnum(['create', 'update', 'delete', 'update_status', 'record_payment', 'export', 'import', 'login', 'logout'])
  action: ActionType;

  @IsEnum(['bill', 'collection_rhythm', 'collection_record', 'invoice', 'attachment', 'reconciliation', 'cash_forecast', 'customer', 'subscription', 'export_queue'])
  entityType: EntityType;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  oldValues?: Record<string, any>;

  @IsOptional()
  @IsObject()
  newValues?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  changedFields?: string[];

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AuditLogFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['bill', 'collection_rhythm', 'collection_record', 'invoice', 'attachment', 'reconciliation', 'cash_forecast', 'customer', 'subscription', 'export_queue'])
  entityType?: EntityType;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(['create', 'update', 'delete', 'update_status', 'record_payment', 'export', 'import', 'login', 'logout'])
  action?: ActionType;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
