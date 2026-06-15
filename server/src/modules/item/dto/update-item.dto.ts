import { IsString, IsEnum, IsDateString, IsMongoId, IsOptional } from 'class-validator';
import type { ItemPriority, ItemStatus } from '../../../common/types/index.js';

export class UpdateItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['pending', 'in_progress', 'completed', 'overdue', 'archived'])
  @IsOptional()
  status?: ItemStatus;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: ItemPriority;

  @IsMongoId()
  @IsOptional()
  department?: string;

  @IsMongoId()
  @IsOptional()
  assignee?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}
