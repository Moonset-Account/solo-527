import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateStagePhotoDto {
  @IsNumber()
  stageId: number;

  @IsNumber()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  photoUrl: string;

  @IsString()
  @IsOptional()
  uploader?: string;
}
