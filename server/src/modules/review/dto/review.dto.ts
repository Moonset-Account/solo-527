import { IsString, IsOptional, IsArray, IsEnum, IsInt, Min } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination';
import { ReviewNodeType } from '@/common/enums';
import { ReviewAction } from '../schemas/review-record.schema';

export class CreateReviewFlowDto {
  @IsString()
  name: string;

  @IsArray()
  nodes: Array<{
    name: string;
    type?: ReviewNodeType;
    reviewers: string[];
    order: number;
  }>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  creator: string;
}

export class UpdateReviewFlowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  nodes?: Array<{
    name: string;
    type?: ReviewNodeType;
    reviewers: string[];
    order: number;
  }>;

  @IsOptional()
  description?: string;

  @IsOptional()
  isActive?: boolean;
}

export class QueryReviewRecordDto extends PaginationDto {
  @IsOptional()
  @IsString()
  contentId?: string;

  @IsOptional()
  @IsString()
  reviewer?: string;
}

export class CreateReviewRecordDto {
  @IsString()
  contentId: string;

  @IsString()
  flowId: string;

  @IsString()
  nodeName: string;

  @IsInt()
  @Min(0)
  nodeIndex: number;

  @IsString()
  reviewer: string;

  @IsEnum(ReviewAction)
  action: ReviewAction;

  @IsOptional()
  @IsString()
  comment?: string;
}
