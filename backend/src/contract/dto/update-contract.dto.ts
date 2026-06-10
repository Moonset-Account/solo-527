import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ContractStatus } from '../../common/enums/contract-status.enum';

export class UpdateContractDto {
  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsOptional()
  contractNo?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  signDate?: string;

  @IsString()
  @IsOptional()
  partyA?: string;

  @IsString()
  @IsOptional()
  partyB?: string;

  @IsString()
  @IsOptional()
  contractFile?: string;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsString()
  @IsOptional()
  handler?: string;
}
