import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { Room } from '../entities/room.entity.js';
import { Appointment } from '../entities/appointment.entity.js';
import { WorkOrder } from '../entities/work-order.entity.js';
import { Contract } from '../entities/contract.entity.js';
import { ContractTemplate } from '../entities/contract-template.entity.js';
import { Settlement } from '../entities/settlement.entity.js';
import { SettlementRule } from '../entities/settlement-rule.entity.js';
import { ExceptionOrder } from '../entities/exception-order.entity.js';
import { MessageRecord } from '../entities/message-record.entity.js';
import { PaymentRecord } from '../entities/payment-record.entity.js';
import { VacancyStats } from '../entities/vacancy-stats.entity.js';
import { VacancyAlert } from '../entities/vacancy-alert.entity.js';
import { VacancyAlertConfig } from '../entities/vacancy-alert-config.entity.js';
import { AppointmentSlotConfig } from '../entities/appointment-slot-config.entity.js';
import { WorkflowNodeConfig } from '../entities/workflow-node-config.entity.js';
import { SeederService } from './seeder.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Room,
      Appointment,
      WorkOrder,
      Contract,
      ContractTemplate,
      Settlement,
      SettlementRule,
      ExceptionOrder,
      MessageRecord,
      PaymentRecord,
      VacancyStats,
      VacancyAlert,
      VacancyAlertConfig,
      AppointmentSlotConfig,
      WorkflowNodeConfig,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
