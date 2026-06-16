import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsNumber()
  settlementId?: number;

  @IsOptional()
  @IsNumber()
  contractId?: number;

  @IsNumber()
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  paymentChannel?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
