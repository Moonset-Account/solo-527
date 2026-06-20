import { IsString, IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { SatisfactionLevel } from '../../../common/enums/order.enum';

export class StatisticsQueryDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsUUID()
  @IsOptional()
  photographerId?: string;

  @IsEnum(SatisfactionLevel)
  @IsOptional()
  satisfactionLevel?: SatisfactionLevel;

  @IsString()
  @IsOptional()
  granularity?: 'day' | 'week' | 'month' = 'day';
}

export class ExportQueryDto extends StatisticsQueryDto {
  @IsString()
  @IsOptional()
  format?: 'xlsx' | 'csv' = 'xlsx';

  @IsString()
  @IsOptional()
  type?: 'orders' | 'settlements' | 'materials' | 'satisfaction' = 'orders';
}
