import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ScheduleStatus } from '../schemas/schedule.schema';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  interviewerId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  repeatRule?: string;
}

export class CreateScheduleBatchDto {
  @IsString()
  @IsNotEmpty()
  interviewerId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString({ each: true })
  @IsNotEmpty()
  timeSlots: string[];

  @IsString({ each: true })
  @IsOptional()
  weekdays?: number[];
}
