import { PartialType } from '@nestjs/mapped-types';
import { CreateVacancyAlertConfigDto } from './create-vacancy-alert-config.dto.js';

export class UpdateVacancyAlertConfigDto extends PartialType(CreateVacancyAlertConfigDto) {}
