import { IsString, IsEnum, IsNumber, IsOptional, Min, IsDateString, IsBoolean } from 'class-validator';
import { BillType, BillStatus } from '../entities/bill.entity';

export class CreateBillDto {
  @IsString()
  billNo: string;

  @IsString()
  leaseId: string;

  @IsEnum(['rent', 'deposit', 'service', 'other'])
  type: BillType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  billDate: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(['unpaid', 'paid', 'partial', 'void'])
  status?: BillStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @IsOptional()
  @IsBoolean()
  reconciled?: boolean;

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
