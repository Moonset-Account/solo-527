import { IsNotEmpty, IsString, IsEnum, IsOptional, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['admin', 'manager', 'consultant', 'operator'])
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsArray()
  @IsOptional()
  permissions?: string[];
}
