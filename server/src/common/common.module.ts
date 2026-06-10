import { Module, Global } from '@nestjs/common';
import { OrderNoService } from './services/order-no.service';
import { ExportService } from './services/export.service';
import { NotificationService } from './services/notification.service';

@Global()
@Module({
  providers: [OrderNoService, ExportService, NotificationService],
  exports: [OrderNoService, ExportService, NotificationService],
})
export class CommonModule {}
