import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsNumber, Min, IsDateString, IsInt } from 'class-validator';
import { SettlementStatus, SettlementType } from '../../../common/enums/settlement.enum';

export class CreateSettlementDto {
  @IsUUID()
  photographerId: string;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsNotEmpty()
  settlementPeriod: string;

  @IsEnum(SettlementType)
  @IsOptional()
  type?: SettlementType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  adjustmentAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deductionAmount?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ConfirmSettlementDto {
  @IsString()
  @IsOptional()
  remark?: string;
}

export class PaySettlementDto {
  @IsString()
  @IsNotEmpty()
  paymentProofUrl: string;

  @IsString()
  @IsOptional()
  bankAccountInfo?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class QuerySettlementsDto {
  @IsUUID()
  @IsOptional()
  photographerId?: string;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsEnum(SettlementStatus)
  @IsOptional()
  status?: SettlementStatus;

  @IsEnum(SettlementType)
  @IsOptional()
  type?: SettlementType;

  @IsString()
  @IsOptional()
  settlementPeriod?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  page?: string = '1';

  @IsString()
  @IsOptional()
  pageSize?: string = '20';
}
