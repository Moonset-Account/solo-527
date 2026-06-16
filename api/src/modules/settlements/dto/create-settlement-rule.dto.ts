import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';

export class CreateSettlementRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsEnum(['monthly', 'quarterly', 'yearly'])
  cycle?: 'monthly' | 'quarterly' | 'yearly';

  @IsOptional()
  @IsNumber()
  ratio?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
