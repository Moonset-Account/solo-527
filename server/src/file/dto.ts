import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UploadPhotoDto {
  @IsOptional()
  @IsString()
  description?: string;
}
