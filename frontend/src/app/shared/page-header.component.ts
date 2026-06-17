import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page-header">
      <div class="title-section">
        <h2 class="page-title">{{ title }}</h2>
        <p *ngIf="subtitle" class="page-subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions-section">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 16px;
    }
    .title-section {
      flex: 1;
    }
    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .page-subtitle {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: #666;
    }
    .actions-section {
      display: flex;
      gap: 8px;
    }
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .actions-section {
        width: 100%;
        flex-wrap: wrap;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
}
