import { IsString, IsOptional, IsInt, IsUUID, Min, Max, MaxLength } from 'class-validator';

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
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  suggestion?: string;
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
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
