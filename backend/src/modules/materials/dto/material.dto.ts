import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsArray, IsObject } from 'class-validator';
import { MaterialStatus, MaterialCategory } from '../../../common/enums/material.enum';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  coverImageUrl: string;

  @IsEnum(MaterialCategory)
  @IsOptional()
  category?: MaterialCategory;

  @IsNumber()
  @Min(0)
  pricePersonal: number;

  @IsNumber()
  @Min(0)
  priceCommercial: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceExclusive?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  licenseDescription?: string;

  @IsObject()
  @IsOptional()
  licenseTerms?: Record<string, any>;
}

export class UpdateMaterialDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsEnum(MaterialCategory)
  @IsOptional()
  category?: MaterialCategory;

  @IsEnum(MaterialStatus)
  @IsOptional()
  status?: MaterialStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePersonal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceCommercial?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceExclusive?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  licenseDescription?: string;

  @IsObject()
  @IsOptional()
  licenseTerms?: Record<string, any>;
}

export class QueryMaterialsDto {
  @IsEnum(MaterialStatus)
  @IsOptional()
  status?: MaterialStatus;

  @IsEnum(MaterialCategory)
  @IsOptional()
  category?: MaterialCategory;

  @IsString()
  @IsOptional()
  photographerId?: string;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsString()
  @IsOptional()
  page?: string = '1';

  @IsString()
  @IsOptional()
  pageSize?: string = '20';
}

export class UpdateLicenseDto {
  @IsString()
  @IsOptional()
  licenseDescription?: string;

  @IsObject()
  @IsOptional()
  licenseTerms?: Record<string, any>;
}
