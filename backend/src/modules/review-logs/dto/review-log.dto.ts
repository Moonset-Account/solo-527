import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ReviewAction } from '../schemas/review-log.schema';

export class CreateReviewLogDto {
  @IsString()
  @IsNotEmpty()
  draftId: string;

  @IsEnum(['approve', 'reject'])
  action: ReviewAction;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class QueryReviewLogDto extends PaginationDto {
  @IsOptional()
  @IsString()
  draftId?: string;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsEnum(['approve', 'reject'])
  action?: ReviewAction;

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
