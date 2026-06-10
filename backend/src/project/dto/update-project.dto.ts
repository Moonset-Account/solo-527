import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ProjectStatus } from '../../common/enums/project-status.enum';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  projectNo?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  actualEndDate?: string;

  @IsNumber()
  @IsOptional()
  customerId?: number;

  @IsString()
  @IsOptional()
  salesPerson?: string;

  @IsString()
  @IsOptional()
  projectManager?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  handler?: string;
}
