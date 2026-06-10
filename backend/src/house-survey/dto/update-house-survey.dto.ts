import { IsString, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';

export class UpdateHouseSurveyDto {
  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsDateString()
  @IsOptional()
  surveyDate?: string;

  @IsString()
  @IsOptional()
  surveyor?: string;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsString()
  @IsOptional()
  orientation?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  handler?: string;
}
