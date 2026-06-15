import { IsOptional, IsInt, Min, Max, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit: number = 50;

  @IsOptional()
  @IsString()
  sortBy: string;

  @IsOptional()
  @IsString()
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  search: string;
}

export class DateRangeDto {
  @IsOptional()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @Type(() => Date)
  endDate: Date;
}
