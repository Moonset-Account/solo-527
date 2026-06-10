import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { DesignPlanStatus } from '../../common/enums/design-plan-status.enum';

export class CreateDesignPlanDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  designFile?: string;

  @IsNumber()
  @IsOptional()
  estimatedPrice?: number;

  @IsEnum(DesignPlanStatus)
  @IsOptional()
  status?: DesignPlanStatus;

  @IsString()
  @IsOptional()
  handler?: string;
}
