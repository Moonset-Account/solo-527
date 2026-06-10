import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsInt } from 'class-validator';
import { ConstructionStageStatus } from '../../common/enums/construction-stage-status.enum';

export class UpdateConstructionStageDto {
  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  actualStartDate?: string;

  @IsDateString()
  @IsOptional()
  actualEndDate?: string;

  @IsEnum(ConstructionStageStatus)
  @IsOptional()
  status?: ConstructionStageStatus;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  handler?: string;
}
