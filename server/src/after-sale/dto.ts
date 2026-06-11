import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateAfterSaleDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  customerId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priority?: string;
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
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  resolutionNote?: string;
}

export class AssignAfterSaleDto {
  @IsUUID()
  assignedTo: string;
}

export class AfterSaleFilterDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
