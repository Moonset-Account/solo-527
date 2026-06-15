import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity.js';
import { TimelineEvent } from './entities/timeline-event.entity.js';
import { TicketAsset } from './entities/ticket-asset.entity.js';
import { SlaDetail } from './entities/sla-detail.entity.js';
import { TicketService } from './ticket.service.js';
import { TicketController } from './ticket.controller.js';
import { AssetModule } from '../asset/asset.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TimelineEvent, TicketAsset, SlaDetail]),
    AssetModule,
    AuditModule,
  ],
  providers: [TicketService],
  controllers: [TicketController],
})
export class TicketModule {}
