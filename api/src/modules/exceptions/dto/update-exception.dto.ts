import { PartialType } from '@nestjs/mapped-types';
import { CreateExceptionDto } from './create-exception.dto.js';

export class UpdateExceptionDto extends PartialType(CreateExceptionDto) {}
