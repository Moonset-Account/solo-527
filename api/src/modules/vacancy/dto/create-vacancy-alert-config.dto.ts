import { IsNumber, IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateVacancyAlertConfigDto {
  @IsString()
  name: string;

  @IsString()
  alertType: string;

  @IsNumber()
  thresholdDays: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  notifyRoles?: string[];
}
