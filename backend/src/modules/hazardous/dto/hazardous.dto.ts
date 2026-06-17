import { IsString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { HazardousCategory } from '@/common/enums/index.enum';

export class CreateHazardousLabelDto {
  @IsString()
  labelCode: string;

  @IsEnum(HazardousCategory)
  category: HazardousCategory;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsString()
  hazardStatement?: string;

  @IsOptional()
  @IsString()
  precautionStatement?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ppeRequirements?: string[];

  @IsOptional()
  @IsString()
  storageRequirement?: string;

  @IsOptional()
  @IsString()
  disposalMethod?: string;

  @IsOptional()
  @IsString()
  firstAid?: string;

  @IsOptional()
  @IsString()
  spillHandling?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedReagentIds?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class QueryHazardousLabelDto {
  @IsOptional()
  @IsEnum(HazardousCategory)
  category?: HazardousCategory;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 50;
}
