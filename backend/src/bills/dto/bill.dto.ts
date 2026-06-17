import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsArray, ValidateNested, IsNotEmpty, Min } from 'class-validator';
import { BillType, BillStatus } from '../bill.schema';
import { Type } from 'class-transformer';

export class CreateBillDto {
  @IsEnum(BillType)
  type: BillType;

  @IsString()
  roomNo: string;

  @IsString()
  residentName: string;

  @IsString()
  @IsOptional()
  residentPhone?: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsString()
  billingPeriod: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class PaymentRecordDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  method: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateBillDto {
  @IsEnum(BillStatus)
  @IsOptional()
  status?: BillStatus;

  @IsString()
  @IsOptional()
  remark?: string;
}
