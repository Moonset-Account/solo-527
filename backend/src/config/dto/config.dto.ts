import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ConfigCategory } from '../config.schema';
import { ConfigStatus } from '../../common/decorators/config-status.enum';

export class CreateConfigItemDto {
  @IsString() key: string;
  @IsString() name: string;
  @IsEnum(ConfigCategory) category: ConfigCategory;
  @IsOptional() value?: any;
  @IsOptional() defaultValue?: any;
  @IsString() @IsOptional() description?: string;
  @IsEnum(ConfigStatus) @IsOptional() status?: ConfigStatus;
}

export class UpdateConfigItemDto {
  @IsString() @IsOptional() name?: string;
  @IsEnum(ConfigCategory) @IsOptional() category?: ConfigCategory;
  @IsOptional() value?: any;
  @IsOptional() defaultValue?: any;
  @IsString() @IsOptional() description?: string;
  @IsEnum(ConfigStatus) @IsOptional() status?: ConfigStatus;
}
