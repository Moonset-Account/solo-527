import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Types } from 'mongoose';

export class AddCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  mentions?: string[];
}

export class UpdateBusinessDetailDto {
  @IsOptional()
  @IsString()
  businessContext?: string;

  @IsOptional()
  @IsString()
  impactScope?: string;

  @IsOptional()
  @IsString()
  relatedBusiness?: string;

  @IsOptional()
  @IsString()
  rootCauseAnalysis?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsString()
  preventionMeasure?: string;

  @IsOptional()
  @IsArray()
  relatedAnomalyIds?: string[];

  @IsOptional()
  @IsEnum(['not_started', 'in_progress', 'completed'])
  reviewStatus?: 'not_started' | 'in_progress' | 'completed';
}
