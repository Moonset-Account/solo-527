import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty({ message: '患者姓名不能为空' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @IsString()
  @IsOptional()
  idCard?: string;

  @IsEnum(['男', '女'], { message: '性别只能是男或女' })
  @IsOptional()
  gender?: string;

  @IsDateString({}, { message: '出生日期格式不正确' })
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  allergyHistory?: string;

  @IsString()
  @IsOptional()
  medicalHistory?: string;
}

export class UpdatePatientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  idCard?: string;

  @IsEnum(['男', '女'], { message: '性别只能是男或女' })
  @IsOptional()
  gender?: string;

  @IsDateString({}, { message: '出生日期格式不正确' })
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  allergyHistory?: string;

  @IsString()
  @IsOptional()
  medicalHistory?: string;
}
