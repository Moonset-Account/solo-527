import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { AccountType, ApplicationStatus, Priority } from '../entities/application.entity';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  applicantName: string;

  @IsEnum(AccountType)
  @IsOptional()
  accountType: AccountType;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status: ApplicationStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority: Priority;

  @IsString()
  @IsOptional()
  responsiblePerson: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  department: string;

  @IsString()
  @IsOptional()
  systemName: string;

  @IsDateString()
  @IsOptional()
  changeWindowStart: string;

  @IsDateString()
  @IsOptional()
  changeWindowEnd: string;

  @IsString()
  @IsOptional()
  reason: string;

  @IsString()
  @IsOptional()
  operatorName: string;
}
