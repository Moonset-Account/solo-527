import { IsString, IsOptional } from 'class-validator';

export class FollowUpDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
