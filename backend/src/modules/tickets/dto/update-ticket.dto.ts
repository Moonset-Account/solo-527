import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TicketStatus } from '../entities/ticket.entity';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'closed'])
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  closeRemark?: string;
}
