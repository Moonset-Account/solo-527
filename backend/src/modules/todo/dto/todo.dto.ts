import { IsString, IsEnum, IsOptional, IsDateString, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { TodoType, TodoStatus } from '../entities/todo.entity';

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['voting_exception', 'review', 'follow_up', 'urgent'])
  type: TodoType;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  relatedModule?: string;

  @IsString()
  @IsOptional()
  relatedId?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  affectsHelpProgress?: boolean;

  @IsString()
  @IsOptional()
  helpProgressImpact?: string;

  @IsString()
  assigneeId: string;

  @IsString()
  creatorId: string;
}

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['pending', 'processing', 'completed'])
  @IsOptional()
  status?: TodoStatus;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  priority?: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}

export class QueryTodoDto {
  @IsEnum(['voting_exception', 'review', 'follow_up', 'urgent'])
  @IsOptional()
  type?: TodoType;

  @IsEnum(['pending', 'processing', 'completed'])
  @IsOptional()
  status?: TodoStatus;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  affectsHelpProgress?: boolean;
}
