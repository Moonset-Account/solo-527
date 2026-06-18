import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['admin', 'manager', 'operator', 'viewer'])
  role?: UserRole;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsDateString()
  permissionExpireAt?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['admin', 'manager', 'operator', 'viewer'])
  role?: UserRole;

  @IsOptional()
  @IsEnum(['active', 'disabled', 'expired'])
  status?: UserStatus;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsDateString()
  permissionExpireAt?: string;
}

export class QueryUsersDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(['admin', 'manager', 'operator', 'viewer'])
  role?: UserRole;

  @IsOptional()
  @IsEnum(['active', 'disabled', 'expired'])
  status?: UserStatus;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}
