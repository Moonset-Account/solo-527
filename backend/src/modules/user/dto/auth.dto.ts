import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '原密码不能为空' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '新密码长度不能少于6位' })
  @MaxLength(20, { message: '新密码长度不能超过20位' })
  newPassword: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '真实姓名不能为空' })
  realName: string;

  @IsString()
  phone?: string;

  @IsString()
  email?: string;

  @IsString()
  @IsNotEmpty({ message: '诊所ID不能为空' })
  clinicId: string;

  @IsNotEmpty({ message: '角色不能为空' })
  roleIds: string[];
}

export class UpdateUserDto {
  @IsString()
  realName?: string;

  @IsString()
  phone?: string;

  @IsString()
  email?: string;

  isActive?: boolean;

  roleIds?: string[];
}
