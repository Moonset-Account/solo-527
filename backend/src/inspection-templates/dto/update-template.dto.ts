import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateFrequency } from '../entities/inspection-template.entity';

class TemplateItemDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  type: string;

  @IsBoolean()
  @IsOptional()
  required: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items: TemplateItemDto[];

  @IsEnum(TemplateFrequency)
  @IsOptional()
  frequency: TemplateFrequency;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
