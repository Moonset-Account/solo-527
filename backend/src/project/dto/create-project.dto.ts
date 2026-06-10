import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ProjectStatus } from '../../common/enums/project-status.enum';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  projectNo: string;

  @IsString()
  @IsNotEmpty()
  name: string;

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
  customerId: number;

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
