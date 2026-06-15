import { IsString, IsEnum, IsOptional } from 'class-validator';
import type { UserRole, UserStatus } from '../../../common/types/index.js';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['pm', 'admin'])
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  department?: string;

  @IsEnum(['active', 'disabled'])
  @IsOptional()
  status?: UserStatus;
}
