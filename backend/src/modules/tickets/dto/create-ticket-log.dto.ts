import { IsString, IsOptional } from 'class-validator';

export class CreateTicketLogDto {
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
