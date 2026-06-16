import { IsNumber, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateSettlementDto {
  @IsNumber()
  contractId: number;

  @IsOptional()
  @IsNumber()
  ruleId?: number;

  @IsNumber()
  amount: number;

  @IsEnum(['rent', 'deposit', 'utility', 'damage', 'other'])
  type: 'rent' | 'deposit' | 'utility' | 'damage' | 'other';

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
