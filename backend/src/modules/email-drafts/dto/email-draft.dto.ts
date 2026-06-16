import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { DraftStatus } from '../schemas/email-draft.schema';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateEmailDraftDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceScore?: number;

  @IsOptional()
  @IsString()
  lowConfidenceReason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[];
}

export class UpdateEmailDraftDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['draft', 'pending_review', 'approved', 'rejected', 'sent'])
  status?: DraftStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceScore?: number;

  @IsOptional()
  @IsString()
  lowConfidenceReason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[];
}

export class QueryEmailDraftDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['draft', 'pending_review', 'approved', 'rejected', 'sent'])
  status?: DraftStatus;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  includeDemo?: boolean;
}

export class SubmitReviewDto {
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewDraftDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  comment?: string;
}
