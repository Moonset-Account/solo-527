import { IsUUID, IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto, DateRangeDto } from '@/common/dto/pagination.dto';

export type EntityType = 'bill' | 'invoice' | 'collection_record' | 'reconciliation' | 'cash_forecast';

export class CreateAttachmentDto {
  @IsEnum(['bill', 'invoice', 'collection_record', 'reconciliation', 'cash_forecast'])
  entityType: EntityType;

  @IsUUID()
  entityId: string;

  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  description: string;
}

export class UpdateAttachmentDto {
  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  isPublic: boolean;
}

export class AttachmentFilterDto extends PaginationDto implements DateRangeDto {
  @IsOptional()
  @IsEnum(['bill', 'invoice', 'collection_record', 'reconciliation', 'cash_forecast'])
  entityType: EntityType;

  @IsOptional()
  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsUUID()
  uploadedBy: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
