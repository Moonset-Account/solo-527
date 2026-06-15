import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateSwitchDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsBoolean()
  value: boolean;
}
