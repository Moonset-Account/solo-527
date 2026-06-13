import { IsString, IsEnum, IsOptional, IsDateString, IsBoolean, IsInt } from 'class-validator';
import { TodoType, TodoStatus } from '../entities/todo.entity';

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['voting_exception', 'review', 'follow_up', 'urgent'])
  type: TodoType;

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

  @IsBoolean()
  @IsOptional()
  affectsHelpProgress?: boolean;
}
