import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateEmailVersionDto {
  @IsString()
  @IsNotEmpty()
  draftId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class QueryEmailVersionDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  draftId: string;
}
