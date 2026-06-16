import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CallLogType } from '../schemas/call-log.schema';

export class CreateCallLogDto {
  @IsEnum(['ai_generate', 'knowledge_search'])
  type: CallLogType;

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  response: string;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsNumber()
  tokensUsed?: number;
}

export class QueryCallLogDto extends PaginationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(['ai_generate', 'knowledge_search'])
  type?: CallLogType;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  includeDemo?: boolean;
}
