import { IsString, MinLength, IsOptional, IsArray } from 'class-validator';
import { UserRole } from '@/common/enums/index.enum';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  realName: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  laboratory?: string;

  @IsOptional()
  @IsArray()
  roles?: UserRole[];
}

export class InitAdminDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  realName: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  laboratory?: string;

  @IsString()
  seedToken: string;
}

export class LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number | string;
  user: any;
}
