import { IsString, IsOptional, IsDateString, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { Types } from 'mongoose';

export class CreateProjectDto {
  @IsString()
  projectNo: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  principalInvestigatorId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  fundingSource?: string;

  @IsOptional()
  @IsNumber()
  fundingAmount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class QueryProjectDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  principalInvestigatorId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}

export class CreateProjectReportDto {
  @IsString()
  projectId: string;

  @IsString()
  reportNo: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  reportType?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedApplicationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedReagentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedDocumentIds?: string[];

  @IsOptional()
  @IsDateString()
  reportDate?: string;
}
