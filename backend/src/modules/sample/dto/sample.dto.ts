import { IsString, IsOptional, IsDateString, IsArray, IsEnum, IsNumber, Min } from 'class-validator';
import { SampleStatus } from '../../../common/enums/index.enum';

export class CreateSampleDto {
  @IsString()
  sampleCode: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  storageLocation?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsEnum(SampleStatus)
  status?: SampleStatus;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  relatedReagentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedApplicationIds?: string[];

  @IsOptional()
  @IsString()
  originalDocumentId?: string;

  @IsOptional()
  @IsString()
  currentHolderId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateSampleStatusDto {
  @IsEnum(SampleStatus)
  status: SampleStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  holderId?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QuerySampleDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(SampleStatus)
  status?: SampleStatus;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  currentHolderId?: string;

  @IsOptional()
  @IsBoolean()
  unknownOnly?: boolean;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
