import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkflowNodeDto } from './create-workflow-node.dto.js';

export class UpdateWorkflowNodeDto extends PartialType(CreateWorkflowNodeDto) {}
