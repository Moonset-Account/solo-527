import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { DepositType, DepositStatus } from '../entities/deposit.entity';

export class DepositQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  leaseId?: string;

  @IsOptional()
  @IsEnum(['received', 'refunded', 'deducted'])
  type?: DepositType;

  @IsOptional()
  @IsEnum(['active', 'refunded', 'deducted'])
  status?: DepositStatus;

  @IsOptional()
  @IsDateString()
  receiveDateFrom?: string;

  @IsOptional()
  @IsDateString()
  receiveDateTo?: string;

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
