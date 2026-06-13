import { IsString, IsOptional, IsNumber, IsUUID, ValidateNested, MaxLength, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialItemDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  unitPrice: number;
}

export class BudgetItemDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  laborCost?: number;

  @IsOptional()
  @IsNumber()
  sort?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialItemDto)
  materials?: MaterialItemDto[];
}

export class CreateBudgetDto {
  @IsOptional()
  @IsString()
  changeReason?: string;

  @IsNumber()
  laborCost: number;

  @IsNumber()
  materialCost: number;

  @IsNumber()
  totalCost: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items?: BudgetItemDto[];
}

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  changeReason?: string;

  @IsOptional()
  @IsNumber()
  laborCost?: number;

  @IsOptional()
  @IsNumber()
  materialCost?: number;

  @IsOptional()
  @IsNumber()
  totalCost?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items?: BudgetItemDto[];
}

export class RejectBudgetDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
