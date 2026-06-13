import { IsString, IsOptional, IsUUID, MaxLength, IsDateString } from 'class-validator';

export class CreateAfterSaleDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;
}

export class UpdateAfterSaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class AssignAfterSaleDto {
  @IsUUID()
  assigneeId: string;
}

export class AfterSaleFilterDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
