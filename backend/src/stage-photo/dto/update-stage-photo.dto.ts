import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateStagePhotoDto {
  @IsNumber()
  @IsOptional()
  stageId?: number;

  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  uploader?: string;
}
