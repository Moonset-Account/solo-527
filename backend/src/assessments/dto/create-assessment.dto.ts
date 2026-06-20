import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { HireResult } from '../../common/enums/hire-result.enum';

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  interviewId: string;

  @IsArray()
  @IsOptional()
  dimensions?: {
    dimension: string;
    score: number;
    weight: number;
    comment?: string;
  }[];

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  totalScore?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  technicalScore?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  communicationScore?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  problemSolvingScore?: number;

  @IsString()
  @IsOptional()
  overallComment?: string;

  @IsString()
  @IsOptional()
  strengths?: string;

  @IsString()
  @IsOptional()
  weaknesses?: string;

  @IsEnum(HireResult)
  @IsOptional()
  recommendation?: HireResult;

  @IsString()
  @IsOptional()
  suggestedLevel?: string;

  @IsString()
  @IsOptional()
  suggestedSalary?: string;

  @IsArray()
  @IsOptional()
  usedQuestions?: string[];

  @IsBoolean()
  @IsOptional()
  isFinal?: boolean;
}
