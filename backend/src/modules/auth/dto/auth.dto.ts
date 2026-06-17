import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number | string;
  user: any;
}
