import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateWorkflowNodeDto {
  @IsEnum(['contract', 'settlement', 'appointment'])
  processType: 'contract' | 'settlement' | 'appointment';

  @IsString()
  nodeName: string;

  @IsOptional()
  @IsNumber()
  nodeOrder?: number;

  @IsOptional()
  @IsString()
  approverRole?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
