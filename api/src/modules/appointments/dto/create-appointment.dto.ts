import { IsNumber, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  userId: number;

  @IsDateString()
  appointmentTime: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
