import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ExportType, ExportFormat } from './export-log.entity.js';

export class ExportLogFilterDto {
  @IsOptional()
  @IsEnum(ExportType)
  type?: ExportType;

  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class ExportDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = 'xlsx';
}
