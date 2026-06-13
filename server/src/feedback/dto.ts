import { IsString, IsOptional, IsInt, IsUUID, Min, Max, MaxLength, IsBoolean } from 'class-validator';

export class CreateFeedbackDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(50)
  stage: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  serviceRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  scheduleRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  costRating?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  suggestion?: string;

  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;
}

export class FeedbackFilterDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class FeedbackStatsDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
