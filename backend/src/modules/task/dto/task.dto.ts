import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { TaskType, TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['rectification', 'patrol', 'review'])
  type: TaskType;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  checkpoints?: string;

  @IsString()
  @IsOptional()
  eventId?: string;

  @IsString()
  assigneeId: string;

  @IsString()
  creatorId: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: TaskStatus;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  checkpoints?: string;

  @IsString()
  @IsOptional()
  result?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}

export class QueryTaskDto {
  @IsEnum(['rectification', 'patrol', 'review'])
  @IsOptional()
  type?: TaskType;

  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  eventId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
