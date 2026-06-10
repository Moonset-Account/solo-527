import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateMaterialCostDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  materialName: string;

  @IsString()
  @IsOptional()
  specification?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  handler?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
