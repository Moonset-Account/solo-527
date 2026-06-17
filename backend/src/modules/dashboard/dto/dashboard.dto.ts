import { IsString, IsOptional, IsArray, IsDateString, IsNumber } from 'class-validator';

export class CreateOriginalDocumentDto {
  @IsString()
  documentNo: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsDateString()
  documentDate?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedReagentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedApplicationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedSampleIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedProjectIds?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}

export class QueryOriginalDocumentDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  relatedModule?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
