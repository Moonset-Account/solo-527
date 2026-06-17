import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TicketType, TicketStatus, TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsString()
  ticketNo: string;

  @IsEnum(['maintenance', 'complaint'])
  type: TicketType;

  @IsString()
  propertyId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'closed'])
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  reporterName?: string;

  @IsOptional()
  @IsString()
  reporterContact?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceRemark?: string;
}
