import { IsString, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../../shared/types.js';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
