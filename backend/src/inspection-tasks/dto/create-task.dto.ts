import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../entities/inspection-task.entity';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsString()
  @IsNotEmpty()
  assignee: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status: TaskStatus;

  @IsString()
  @IsOptional()
  notes: string;
}
