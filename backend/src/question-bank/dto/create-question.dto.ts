import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { QuestionType, DifficultyLevel } from '../schemas/question.schema';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  type: QuestionType;

  @IsEnum(DifficultyLevel)
  @IsNotEmpty()
  difficulty: DifficultyLevel;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  referenceAnswer?: string;

  @IsString()
  @IsOptional()
  analysis?: string;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsArray()
  @IsOptional()
  correctAnswers?: number[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  defaultScore?: number;

  @IsNumber()
  @IsOptional()
  estimatedTime?: number;
}
