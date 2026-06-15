import { IsString, IsEnum, IsOptional } from 'class-validator';
import type { ReviewConclusion } from '../../../common/types/index.js';

export class UpdateReviewDto {
  @IsEnum(['completed', 'partial', 'incomplete', 'escalated'])
  @IsOptional()
  conclusion?: ReviewConclusion;

  @IsString()
  @IsOptional()
  remark?: string;
}
