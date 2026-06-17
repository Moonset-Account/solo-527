import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'default';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge" [ngClass]="'badge-' + status">
      {{ label }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
    }
    .badge-success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .badge-warning {
      background-color: #fff3e0;
      color: #ef6c00;
    }
    .badge-error {
      background-color: #ffebee;
      color: #c62828;
    }
    .badge-info {
      background-color: #e3f2fd;
      color: #1565c0;
    }
    .badge-default {
      background-color: #f5f5f5;
      color: #616161;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: BadgeStatus = 'default';
  @Input() label: string = '';
}
