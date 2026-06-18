import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class TriggerConditionDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsOptional()
  params?: Record<string, any>;
}

class ActionDto {
  @IsNumber()
  @IsNotEmpty()
  remindHours: number;

  @IsArray()
  @IsNotEmpty()
  remindMethod: string[];

  @IsArray()
  @IsOptional()
  remindTarget?: string[];
}

class ScopeDto {
  @IsArray()
  @IsOptional()
  departments?: string[];

  @IsArray()
  @IsOptional()
  roles?: string[];

  @IsArray()
  @IsOptional()
  leadSources?: string[];
}

export class CreateFollowupRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => TriggerConditionDto)
  @IsNotEmpty()
  triggerCondition: TriggerConditionDto;

  @ValidateNested()
  @Type(() => ActionDto)
  @IsNotEmpty()
  action: ActionDto;

  @ValidateNested()
  @Type(() => ScopeDto)
  @IsOptional()
  scope?: ScopeDto;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
