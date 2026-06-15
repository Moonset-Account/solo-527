import { IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { TicketStatus, TicketPriority } from '../../../../shared/types.js';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  assigneeId?: number;
}
