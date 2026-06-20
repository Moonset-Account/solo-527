import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateConfigDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsNotEmpty()
  updatedBy: { userId: string; userName: string };

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateConfigDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsNotEmpty()
  @IsOptional()
  updatedBy?: { userId: string; userName: string };

  @IsString()
  @IsOptional()
  description?: string;
}

export class QueryConfigDto {
  @IsString()
  @IsOptional()
  type?: string;
}
