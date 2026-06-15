import { IsString, IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import type { ReviewConclusion } from '../../../common/types/index.js';

export class CreateReviewDto {
  @IsMongoId()
  @IsNotEmpty()
  itemId: string;

  @IsEnum(['completed', 'partial', 'incomplete', 'escalated'])
  conclusion: ReviewConclusion;

  @IsString()
  @IsNotEmpty()
  remark: string;
}
