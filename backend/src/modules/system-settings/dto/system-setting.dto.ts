import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateSystemSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSystemSettingDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class QuerySystemSettingDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}
