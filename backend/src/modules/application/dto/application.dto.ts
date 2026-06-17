import { IsString, IsOptional, IsArray, IsEnum, IsDateString, IsNumber, ValidateNested, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus, ApplicationType } from '../../../common/enums/index.enum';

export class ApplicationItemDto {
  @IsString()
  reagentId: string;

  @IsString()
  reagentName: string;

  @IsOptional()
  @IsString()
  reagentBatchNo?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationType)
  type?: ApplicationType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationItemDto)
  items: ApplicationItemDto[];

  @IsString()
  purpose: string;

  @IsOptional()
  @IsDateString()
  expectedPickDate?: string;

  @IsOptional()
  @IsString()
  pickLocation?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedSampleIds?: string[];

  @IsOptional()
  @IsString()
  originalDocumentId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SubmitApplicationDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApproveApplicationDto {
  @IsOptional()
  @IsString()
  remark?: string;
}

export class RejectApplicationDto {
  @IsString()
  reason: string;
}

export class PickApplicationDto {
  @IsArray()
  items: Array<{ reagentId: string; actualQuantity: number }>;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsEnum(ApplicationType)
  type?: ApplicationType;

  @IsOptional()
  @IsString()
  applicantId?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
