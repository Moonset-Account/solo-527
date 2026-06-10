import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ContractStatus } from '../../common/enums/contract-status.enum';

export class CreateContractDto {
  @IsNumber()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  contractNo: string;

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
