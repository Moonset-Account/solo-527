import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
} from 'class-validator';
import { TicketType, TicketPriority } from '../../../../shared/types.js';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(TicketType)
  type: TicketType;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  assetIds?: number[];
}
