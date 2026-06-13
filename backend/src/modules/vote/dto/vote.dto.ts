import { IsString, IsEnum, IsOptional, IsDateString, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VoteStatus, VoteType } from '../entities/vote.entity';

class VoteOptionDto {
  @IsString()
  text: string;
}

export class CreateVoteDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['single', 'multiple'])
  @IsOptional()
  type?: VoteType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoteOptionDto)
  options: VoteOptionDto[];

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  allowAbstain?: boolean;

  @IsString()
  @IsOptional()
  ruleId?: string;

  @IsString()
  @IsOptional()
  eventId?: string;

  @IsString()
  creatorId: string;
}

export class UpdateVoteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['draft', 'ongoing', 'ended', 'cancelled'])
  @IsOptional()
  status?: VoteStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoteOptionDto)
  @IsOptional()
  options?: VoteOptionDto[];

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;
}

export class CastVoteDto {
  @IsArray()
  @IsOptional()
  selectedOptions?: string[];

  @IsBoolean()
  @IsOptional()
  isAbstained?: boolean;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  voterId: string;
}

export class CreateVoteRuleDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  passThreshold?: number;

  @IsNumber()
  @IsOptional()
  quorumThreshold?: number;

  @IsNumber()
  @IsOptional()
  votingDurationHours?: number;

  @IsBoolean()
  @IsOptional()
  allowProxyVoting?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsArray()
  @IsOptional()
  eligibleRoles?: string[];
}

export class QueryVoteDto {
  @IsEnum(['draft', 'ongoing', 'ended', 'cancelled'])
  @IsOptional()
  status?: VoteStatus;

  @IsString()
  @IsOptional()
  creatorId?: string;

  @IsString()
  @IsOptional()
  eventId?: string;
}
