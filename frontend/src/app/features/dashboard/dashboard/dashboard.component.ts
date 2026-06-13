import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ChargeService } from '../../../core/services/charge.service';
import { ReminderService } from '../../../core/services/reminder.service';
import { FollowUpService } from '../../../core/services/followup.service';
import { RevisitService } from '../../../core/services/revisit.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  stats = {
    todayAppointments: 0,
    todayCharges: 0,
    todayRevenue: 0,
    pendingReminders: 0,
    pendingFollowUps: 0,
    churnPatients: 0
  };

  constructor(
    private appointmentService: AppointmentService,
    private chargeService: ChargeService,
    private reminderService: ReminderService,
    private followUpService: FollowUpService,
    private revisitService: RevisitService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    const today = new Date().toISOString().split('T')[0];

    this.appointmentService.getStatistics(today, today).subscribe(data => {
      this.stats.todayAppointments = data?.total || 0;
    });

    this.chargeService.getStatistics(today, today).subscribe(data => {
      this.stats.todayCharges = data?.count || 0;
      this.stats.todayRevenue = data?.totalAmount || 0;
    });

    this.reminderService.getMyReminders(1, 1).subscribe(data => {
      this.stats.pendingReminders = data?.total || 0;
    });

    this.followUpService.getMyFollowUps(1, 1).subscribe(data => {
      this.stats.pendingFollowUps = data?.total || 0;
    });

    this.revisitService.getMyRevisitChurns(1, 1).subscribe(data => {
      this.stats.churnPatients = data?.total || 0;
    });
  }
}
