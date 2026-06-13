import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsBoolean, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, EventStatus } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['rectification', 'vote', 'patrol'])
  type: EventType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  gridArea?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsString()
  reporterId: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['rectification', 'vote', 'patrol'])
  @IsOptional()
  type?: EventType;

  @IsEnum(['pending', 'processing', 'reviewing', 'voting', 'completed', 'closed'])
  @IsOptional()
  status?: EventStatus;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  gridArea?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  reviewResult?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isRectified?: boolean;

  @IsString()
  @IsOptional()
  rectificationResult?: string;

  @IsString()
  @IsOptional()
  operatorId?: string;
}

export class QueryEventDto {
  @IsEnum(['rectification', 'vote', 'patrol'])
  @IsOptional()
  type?: EventType;

  @IsEnum(['pending', 'processing', 'reviewing', 'voting', 'completed', 'closed'])
  @IsOptional()
  status?: EventStatus;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  reporterId?: string;

  @IsString()
  @IsOptional()
  gridArea?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  shift?: string;
}

export class CreateNoteDto {
  @IsString()
  content: string;

  @IsString()
  eventId: string;

  @IsString()
  creatorId: string;
}

export class CreateAttachmentDto {
  @IsString()
  eventId: string;

  @IsString()
  uploaderId: string;
}
