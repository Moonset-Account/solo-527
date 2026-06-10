import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { InspectionResult } from '../../common/enums/inspection-result.enum';

export class CompleteInspectionTaskDto {
  @IsEnum(InspectionResult)
  result: InspectionResult;

  @IsString()
  @IsOptional()
  issues?: string;

  @IsDateString()
  @IsOptional()
  rectificationDeadline?: string;

  @IsString()
  @IsOptional()
  handler?: string;
}
