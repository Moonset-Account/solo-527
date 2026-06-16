import { IsString, IsOptional, IsEnum } from 'class-validator';

export class PaymentResultDto {
  @IsEnum(['success', 'failed'])
  status: 'success' | 'failed';

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
