import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { InspectionResult } from '../../common/enums/inspection-result.enum';
import { InspectionStatus } from '../../common/enums/inspection-status.enum';

export class UpdateInspectionTaskDto {
  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsNumber()
  @IsOptional()
  stageId?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  planDate?: string;

  @IsString()
  @IsOptional()
  inspector?: string;

  @IsDateString()
  @IsOptional()
  actualDate?: string;

  @IsEnum(InspectionResult)
  @IsOptional()
  result?: InspectionResult;

  @IsString()
  @IsOptional()
  issues?: string;

  @IsDateString()
  @IsOptional()
  rectificationDeadline?: string;

  @IsEnum(InspectionStatus)
  @IsOptional()
  status?: InspectionStatus;

  @IsString()
  @IsOptional()
  handler?: string;
}
