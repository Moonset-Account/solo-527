import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { BillType, BillStatus } from '../entities/bill.entity';

export class BillQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  leaseId?: string;

  @IsOptional()
  @IsEnum(['rent', 'deposit', 'service', 'other'])
  type?: BillType;

  @IsOptional()
  @IsEnum(['unpaid', 'paid', 'partial', 'void'])
  status?: BillStatus;

  @IsOptional()
  @IsDateString()
  billDateFrom?: string;

  @IsOptional()
  @IsDateString()
  billDateTo?: string;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  reconciled?: boolean;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;
}
