import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(['admin', 'manager', 'consultant', 'operator'])
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsArray()
  @IsOptional()
  permissions?: string[];
}
