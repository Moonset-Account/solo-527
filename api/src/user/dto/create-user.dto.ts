import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../../../../shared/types.js';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsEnum(UserRole)
  role: UserRole;
}
