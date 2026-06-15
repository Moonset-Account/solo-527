import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../entities/inspection-task.entity';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  assignee: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status: TaskStatus;

  @IsString()
  @IsOptional()
  notes: string;
}
