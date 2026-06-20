import { IsOptional, IsString, IsEnum, IsEmail, IsNumber, Min, Max, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../../../common/enums/user.enum';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  settlementRatio?: number;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  settlementRatio?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryUsersDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsString()
  @IsOptional()
  page?: string = '1';

  @IsString()
  @IsOptional()
  pageSize?: string = '20';
}
