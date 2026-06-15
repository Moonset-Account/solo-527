import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import type { UserRole } from '../../../common/types/index.js';

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

  @IsEnum(['pm', 'admin'])
  @IsNotEmpty()
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsEnum(['active', 'disabled'])
  @IsOptional()
  status?: 'active' | 'disabled';
}
