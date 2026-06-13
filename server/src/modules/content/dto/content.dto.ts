import { IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination';
import { ContentStatus } from '@/common/enums';

export class QueryContentDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  creator?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reviewFlowId?: string;

  @IsOptional()
  isException?: boolean;
}

export class CreateContentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  script?: string;

  @IsOptional()
  @IsString()
  reviewFlowId?: string;

  @IsOptional()
  @IsArray()
  targetPlatforms?: string[];

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsString()
  creator: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  script?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsString()
  reviewFlowId?: string;

  @IsOptional()
  @IsArray()
  targetPlatforms?: string[];

  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @IsString()
  scheduleId?: string;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  attachments?: Array<{ name: string; url: string; type: string; size: number }>;
}

export class SubmitReviewDto {
  @IsString()
  operator: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class HandleExceptionDto {
  @IsString()
  conclusion: string;

  @IsString()
  handler: string;
}
