import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { AccountType, Priority } from '../entities/application.entity';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  applicantName: string;

  @IsEnum(AccountType)
  accountType: AccountType;

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
