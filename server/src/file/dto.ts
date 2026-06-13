import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UploadPhotoDto {
  @IsOptional()
  @IsString()
  area?: string;
}

export class UploadFileDto {
  @IsString()
  entityType: 'contract' | 'project';

  @IsUUID()
  entityId: string;
}
