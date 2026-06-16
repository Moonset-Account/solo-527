import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateWorkflowNodeDto {
  @IsString()
  name: string;

  @IsString()
  workflowType: string;

  @IsEnum(['start', 'end', 'approve', 'notify', 'condition'])
  nodeType: 'start' | 'end' | 'approve' | 'notify' | 'condition';

  @IsString()
  nodeKey: string;

  @IsOptional()
  config?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  orderNum?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
