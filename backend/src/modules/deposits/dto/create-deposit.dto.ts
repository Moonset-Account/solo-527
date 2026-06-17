import { IsString, IsEnum, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';
import { DepositType, DepositStatus } from '../entities/deposit.entity';

export class CreateDepositDto {
  @IsString()
  depositNo: string;

  @IsString()
  leaseId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(['received', 'refunded', 'deducted'])
  type: DepositType;

  @IsOptional()
  @IsEnum(['active', 'refunded', 'deducted'])
  status?: DepositStatus;

  @IsOptional()
  @IsDateString()
  receiveDate?: string;

  @IsOptional()
  @IsDateString()
  refundDate?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceRemark?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
