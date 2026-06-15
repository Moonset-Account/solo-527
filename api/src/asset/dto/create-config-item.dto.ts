import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Environment } from '../../../../shared/types.js';

export class CreateConfigItemDto {
  @IsInt()
  assetId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsEnum(Environment)
  @IsOptional()
  environment?: Environment;

  @IsString()
  @IsOptional()
  description?: string;
}
