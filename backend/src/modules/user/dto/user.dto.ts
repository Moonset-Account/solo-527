import { IsString, IsEnum, IsOptional, IsBoolean, IsPhoneNumber } from 'class-validator';
import { UserRole, UserShift } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsEnum(['admin', 'manager', 'worker', 'resident'])
  @IsOptional()
  role?: UserRole;

  @IsEnum(['morning', 'afternoon', 'night'])
  @IsOptional()
  shift?: UserShift;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  gridArea?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(['admin', 'manager', 'worker', 'resident'])
  @IsOptional()
  role?: UserRole;

  @IsEnum(['morning', 'afternoon', 'night'])
  @IsOptional()
  shift?: UserShift;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  gridArea?: string;

  @IsBoolean()
  @IsOptional()
  isVotingEligible?: boolean;

  @IsString()
  @IsOptional()
  votingIneligibleReason?: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class QueryUserDto {
  @IsEnum(['admin', 'manager', 'worker', 'resident'])
  @IsOptional()
  role?: UserRole;

  @IsEnum(['morning', 'afternoon', 'night'])
  @IsOptional()
  shift?: UserShift;

  @IsString()
  @IsOptional()
  gridArea?: string;

  @IsBoolean()
  @IsOptional()
  isVotingEligible?: boolean;
}
