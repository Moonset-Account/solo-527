import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateAppointmentSlotDto {
  @IsString()
  name: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  intervalMinutes?: number;

  @IsOptional()
  @IsNumber()
  maxAppointments?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
