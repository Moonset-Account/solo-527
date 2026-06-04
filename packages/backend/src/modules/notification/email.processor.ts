import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationService } from './notification.service';

@Processor('email')
export class EmailProcessor {
  constructor(private notificationService: NotificationService) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<{ notificationId: string }>) {
    await this.notificationService.sendEmail(job.data.notificationId);
  }
}
