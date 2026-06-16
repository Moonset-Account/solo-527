import { PartialType } from '@nestjs/mapped-types';
import { CreateSettlementDto } from './create-settlement.dto.js';

export class UpdateSettlementDto extends PartialType(CreateSettlementDto) {}
