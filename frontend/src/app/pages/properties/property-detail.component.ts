import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Property, PricePlan, RoomStatusLog, SourceRecord } from '../../types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTabsModule, MatListModule, MatDividerModule, MatButtonModule, MatIconModule, StatusBadgeComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      房源详情
      <button mat-icon-button class="close-btn" (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </h2>
    <mat-dialog-content class="dialog-content">
      <mat-tab-group>
        <mat-tab label="基础信息">
          <div class="tab-content">
            <mat-list>
              <mat-list-item>
                <span class="label">房源编号：</span>
                <span class="value">{{ property.code }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">房源名称：</span>
                <span class="value">{{ property.name }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">类型：</span>
                <span class="value">{{ getTypeLabel(property.type) }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">楼栋：</span>
                <span class="value">{{ property.building }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">楼层：</span>
                <span class="value">{{ property.floor }}层</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">面积：</span>
                <span class="value">{{ property.area }}㎡</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">月租金：</span>
                <span class="value price">¥{{ property.price }}/月</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">状态：</span>
                <app-status-badge [status]="getStatusBadge(property.status)" [label]="getStatusLabel(property.status)"></app-status-badge>
              </mat-list-item>
              <mat-divider *ngIf="property.description"></mat-divider>
              <mat-list-item *ngIf="property.description">
                <span class="label">描述：</span>
                <span class="value">{{ property.description }}</span>
              </mat-list-item>
            </mat-list>
          </div>
        </mat-tab>

        <mat-tab label="价格历史">
          <div class="tab-content">
            <mat-list *ngIf="pricePlans.length > 0">
              <mat-list-item *ngFor="let plan of pricePlans" class="history-item">
                <div class="history-main">
                  <span class="history-name">{{ plan.name }}</span>
                  <span class="history-price">¥{{ plan.price }}/月</span>
                  <span *ngIf="plan.isCurrent" class="current-tag">当前</span>
                </div>
                <div class="history-meta">
                  <span>生效日期：{{ plan.effectiveDate }}</span>
                  <span>来源：{{ plan.source }}</span>
                </div>
              </mat-list-item>
            </mat-list>
            <div *ngIf="pricePlans.length === 0" class="empty">暂无价格历史</div>
          </div>
        </mat-tab>

        <mat-tab label="房态历史">
          <div class="tab-content">
            <mat-list *ngIf="statusLogs.length > 0">
              <mat-list-item *ngFor="let log of statusLogs" class="history-item">
                <div class="history-main">
                  <app-status-badge [status]="getStatusBadge(log.status)" [label]="getStatusLabel(log.status)"></app-status-badge>
                  <span class="history-reason">{{ log.reason }}</span>
                </div>
                <div class="history-meta">
                  <span>操作人：{{ log.operator }}</span>
                  <span>{{ log.createdAt }}</span>
                </div>
              </mat-list-item>
            </mat-list>
            <div *ngIf="statusLogs.length === 0" class="empty">暂无房态历史</div>
          </div>
        </mat-tab>

        <mat-tab label="来源记录">
          <div class="tab-content">
            <mat-list *ngIf="sources.length > 0">
              <mat-list-item *ngFor="let record of sources" class="history-item">
                <div class="history-main">
                  <span class="history-action">{{ record.action }}</span>
                  <span class="history-operator">{{ record.operator }}</span>
                </div>
                <div class="history-meta">
                  <span>{{ record.detail }}</span>
                </div>
                <span class="history-date">{{ record.createdAt }}</span>
              </mat-list-item>
            </mat-list>
            <div *ngIf="sources.length === 0" class="empty">暂无来源记录</div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-title { display: flex; justify-content: space-between; align-items: center; margin: 0; padding: 16px 24px; }
    .close-btn { margin-right: -8px; }
    .dialog-content { padding: 0; min-height: 450px; }
    .tab-content { padding: 16px 0; }
    .label { color: #666; min-width: 100px; }
    .value { color: #333; }
    .price { color: #1976d2; font-weight: 600; font-size: 16px; }
    .history-item {
      display: flex !important;
      flex-direction: column;
      align-items: flex-start !important;
      gap: 6px;
      padding: 12px 0 !important;
    }
    .history-main { display: flex; align-items: center; gap: 12px; }
    .history-name { font-weight: 500; }
    .history-price { color: #1976d2; font-weight: 600; }
    .current-tag {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .history-reason { color: #666; }
    .history-action { font-weight: 500; }
    .history-operator { color: #666; font-size: 13px; }
    .history-meta { display: flex; gap: 16px; font-size: 13px; color: #666; }
    .history-date { color: #999; font-size: 12px; }
    .empty { text-align: center; color: #999; padding: 40px 0; }
  `]
})
export class PropertyDetailComponent implements OnInit {
  private mockDataService = inject(MockDataService);

  property: Property;
  pricePlans: PricePlan[] = [];
  statusLogs: RoomStatusLog[] = [];
  sources: SourceRecord[] = [];

  constructor(
    public dialogRef: MatDialogRef<PropertyDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { property: Property }
  ) {
    this.property = data.property;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.mockDataService.getPricePlans({ propertyId: this.property.id }).subscribe(data => {
      this.pricePlans = data;
    });
    this.mockDataService.getRoomStatusLogs(this.property.id).subscribe(data => {
      this.statusLogs = data;
    });
    this.mockDataService.getSourceRecords('property', this.property.id).subscribe(data => {
      this.sources = data;
    });
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      office: '办公室',
      studio: '工作室',
      shop: '商铺'
    };
    return map[type] || type;
  }

  getStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      vacant: 'success',
      rented: 'info',
      maintenance: 'warning',
      closed: 'default'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      vacant: '空置',
      rented: '已租',
      maintenance: '维修中',
      closed: '已关闭'
    };
    return map[status] || status;
  }
}
