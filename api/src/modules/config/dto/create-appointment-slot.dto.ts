import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateAppointmentSlotDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  interval?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
