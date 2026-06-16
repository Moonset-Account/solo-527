import { IsNumber } from 'class-validator';

export class ApproveSettlementDto {
  @IsNumber()
  approvedBy: number;
}
