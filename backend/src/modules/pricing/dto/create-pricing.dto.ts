import { IsString, IsEnum, IsNumber, IsOptional, Min, IsDateString, IsBoolean } from 'class-validator';
import { PriceType } from '../entities/pricing.entity';

export class CreatePricingDto {
  @IsString()
  propertyId: string;

  @IsString()
  name: string;

  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  priceType: PriceType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsDateString()
  validFrom: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceRemark?: string;
}
