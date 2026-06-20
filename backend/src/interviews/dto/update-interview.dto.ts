import { IsString, IsOptional, IsEnum, IsDateString, IsNotEmpty } from 'class-validator';
import { InterviewStatus } from '../../common/enums/interview-status.enum';
import { HireResult } from '../../common/enums/hire-result.enum';

export class UpdateInterviewDto {
  @IsString()
  @IsOptional()
  candidateName?: string;

  @IsString()
  @IsOptional()
  candidatePhone?: string;

  @IsString()
  @IsOptional()
  candidateEmail?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  level?: string;

  @IsOptional()
  skills?: string[];

  @IsEnum(InterviewStatus)
  @IsOptional()
  status?: InterviewStatus;

  @IsEnum(HireResult)
  @IsOptional()
  hireResult?: HireResult;

  @IsDateString()
  @IsOptional()
  interviewDate?: string;

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
  remark?: string;
}

export class UpdateInterviewStatusDto {
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  status: InterviewStatus;

  @IsString()
  @IsOptional()
  remark?: string;
}
