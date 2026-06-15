import { IsString, IsEnum, IsDateString, IsMongoId, IsNotEmpty } from 'class-validator';
import type { ItemPriority } from '../../../common/types/index.js';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority: ItemPriority;

  @IsMongoId()
  department: string;

  @IsMongoId()
  assignee: string;

  @IsDateString()
  deadline: string;
}
