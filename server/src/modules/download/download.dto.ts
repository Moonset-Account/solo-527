import { IsString, IsOptional } from 'class-validator';

export class QueryDownloadDto {
  @IsString()
  @IsOptional()
  environment?: string;
}
