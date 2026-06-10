import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum, IsDateString, IsInt } from 'class-validator';
import { ConstructionStageStatus } from '../../common/enums/construction-stage-status.enum';

export class CreateConstructionStageDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

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
