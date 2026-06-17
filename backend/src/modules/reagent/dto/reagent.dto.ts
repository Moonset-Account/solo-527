import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsArray, Min, IsEnum } from 'class-validator';
import { Types } from 'mongoose';
import { HazardousCategory } from '@/common/enums/index.enum';

export class CreateReagentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  casNo?: string;

  @IsOptional()
  @IsString()
  molecularFormula?: string;

  @IsOptional()
  @IsNumber()
  molecularWeight?: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  purity?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  totalQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  availableQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  warningThreshold?: number;

  @IsOptional()
  @IsDateString()
  productionDate?: string;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean;

  @IsOptional()
  @IsEnum(HazardousCategory)
  hazardousCategory?: HazardousCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hazardLabels?: string[];

  @IsOptional()
  storage?: {
    location?: string;
    cabinet?: string;
    temperature?: number;
    storageCondition?: string;
  };

  @IsOptional()
  @IsString()
  safetyDataSheet?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  relatedProjects?: Types.ObjectId[];

  @IsOptional()
  originalDocumentId?: Types.ObjectId;
}

export class UpdateReagentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  availableQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  warningThreshold?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  storage?: {
    location?: string;
    cabinet?: string;
    temperature?: number;
    storageCondition?: string;
  };
}

export class QueryReagentDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean;

  @IsOptional()
  @IsEnum(HazardousCategory)
  hazardousCategory?: HazardousCategory;

  @IsOptional()
  @IsBoolean()
  lowStock?: boolean;

  @IsOptional()
  @IsBoolean()
  nearExpiry?: boolean;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
