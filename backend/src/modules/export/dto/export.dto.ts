import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { ExportFormat, ExportType } from '@/database/entities';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class CreateExportDto {
  @IsEnum(['bills', 'collections', 'cash_forecast', 'reconciliation', 'invoices'])
  type: ExportType;

  @IsEnum(['xlsx', 'csv', 'pdf'])
  format: ExportFormat;

  @IsOptional()
  filters: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns: string[];
}

export class ExportFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'], { each: true })
  status: string[];

  @IsOptional()
  @IsEnum(['bills', 'collections', 'cash_forecast', 'reconciliation', 'invoices'], { each: true })
  type: string[];
}
