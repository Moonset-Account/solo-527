import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class ProgressDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
