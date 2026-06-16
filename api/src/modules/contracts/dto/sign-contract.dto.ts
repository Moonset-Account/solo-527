import { IsString, IsOptional } from 'class-validator';

export class SignContractDto {
  @IsString()
  signedBy: 'owner' | 'tenant';

  @IsOptional()
  @IsString()
  remark?: string;
}
