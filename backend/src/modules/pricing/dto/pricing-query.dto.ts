import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PriceType } from '../entities/pricing.entity';

export class PricingQueryDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  priceType?: PriceType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isCurrent?: boolean;

  @IsOptional()
  @IsDateString()
  validDate?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;
}
