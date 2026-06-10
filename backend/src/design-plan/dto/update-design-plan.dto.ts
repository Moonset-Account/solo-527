import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { DesignPlanStatus } from '../../common/enums/design-plan-status.enum';

export class UpdateDesignPlanDto {
  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsOptional()
  name?: string;

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
