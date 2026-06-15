import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FaultSeverity, FaultStatus } from '../entities/fault.entity';

export class QueryFaultsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(FaultStatus)
  status?: FaultStatus;

  @IsOptional()
  @IsEnum(FaultSeverity)
  severity?: FaultSeverity;
}
