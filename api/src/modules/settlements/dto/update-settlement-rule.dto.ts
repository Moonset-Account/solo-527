import { PartialType } from '@nestjs/mapped-types';
import { CreateSettlementRuleDto } from './create-settlement-rule.dto.js';

export class UpdateSettlementRuleDto extends PartialType(CreateSettlementRuleDto) {}
