import { IsString, IsNotEmpty, IsOptional, IsArray, IsEmail, IsDateString } from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty()
  candidateName: string;

  @IsString()
  @IsNotEmpty()
  candidatePhone: string;

  @IsEmail()
  @IsOptional()
  candidateEmail?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  level?: string;

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsNotEmpty()
  interviewerId: string;

  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @IsDateString()
  @IsNotEmpty()
  interviewDate: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  channel?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  resumeUrl?: string;
}

export class QuickCreateInterviewDto {
  @IsString()
  @IsNotEmpty()
  candidateName: string;

  @IsString()
  @IsNotEmpty()
  candidatePhone: string;

  @IsEmail()
  @IsOptional()
  candidateEmail?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  level?: string;

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsNotEmpty()
  interviewerId: string;

  @IsString()
  @IsOptional()
  scheduleId?: string;

  @IsDateString()
  @IsNotEmpty()
  interviewDate: string;

  @IsString()
  @IsNotEmpty()
  timeSlot: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  channel?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
