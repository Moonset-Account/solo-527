import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateContractDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  tenantId: number;

  @IsNumber()
  ownerId: number;

  @IsOptional()
  @IsNumber()
  templateId?: number;

  @IsString()
  contractNumber: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  rentAmount: number;

  @IsNumber()
  depositAmount: number;

  @IsOptional()
  @IsNumber()
  paymentCycle?: number;
}
