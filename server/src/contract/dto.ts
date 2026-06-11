import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsUUID()
  budgetId: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
