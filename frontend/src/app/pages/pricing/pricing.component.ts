import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Inject } from '@angular/core';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { PricingService } from '../../services/pricing.service';
import { PropertiesService } from '../../services/properties.service';
import { ExportService } from '../../services/export.service';
import { Property, PricePlan } from '../../types';

@Component({
  selector: 'app-price-plan-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>新增价格方案</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>房源</mat-label>
        <mat-select [(ngModel)]="form.propertyId">
          <mat-option *ngFor="let prop of properties" [value]="prop.id">{{ prop.name }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>方案名称</mat-label>
        <input matInput [(ngModel)]="form.name" placeholder="请输入方案名称">
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>价格类型</mat-label>
        <mat-select [(ngModel)]="form.priceType">
          <mat-option value="daily">日租</mat-option>
          <mat-option value="weekly">周租</mat-option>
          <mat-option value="monthly">月租</mat-option>
          <mat-option value="yearly">年租</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>价格(元)</mat-label>
        <input matInput type="number" [(ngModel)]="form.price" placeholder="请输入价格">
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>生效日期</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="form.effectiveDate">
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close()">取消</button>
      <button mat-raised-button color="primary" (click)="onSave()">保存</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-field { width: 100%; margin-top: 12px; }
  `]
})
export class PricePlanFormComponent {
  properties: Property[] = [];
  form: any = {
    propertyId: null,
    name: '',
    priceType: 'monthly',
    price: 0,
    effectiveDate: new Date()
  };

  constructor(
    public dialogRef: MatDialogRef<PricePlanFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { properties: Property[] },
    private propertiesService: PropertiesService
  ) {
    this.properties = data.properties;
    if (this.properties.length > 0) {
      this.form.propertyId = this.properties[0].id;
    }
  }

  onSave(): void {
    this.dialogRef.close(this.form);
  }
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    PricePlanFormComponent
  ],
  template: `
    <app-page-header title="价格管理" subtitle="管理房源价格方案">
      <button mat-stroked-button (click)="onExport()">
        <mat-icon>file_download</mat-icon>
        导出
      </button>
      <button mat-raised-button color="primary" (click)="onAddPricing()">
        <mat-icon>add</mat-icon>
        新增价格方案
      </button>
    </app-page-header>

    <div class="page-content">
      <mat-form-field appearance="outline" class="property-filter">
        <mat-label>按房源筛选</mat-label>
        <mat-select [(ngModel)]="selectedPropertyId" (selectionChange)="loadPricings()">
          <mat-option [value]="null">全部房源</mat-option>
          <mat-option *ngFor="let prop of properties" [value]="prop.id">{{ prop.name }}</mat-option>
        </mat-select>
      </mat-form-field>

      <div *ngFor="let group of groupedPlans" class="property-group">
        <div class="group-header">
          <h3>{{ group.propertyName }}</h3>
          <span class="current-price">当前价：<strong>¥{{ group.currentPrice }}/{{ getPriceTypeLabel(group.currentPriceType) }}</strong></span>
        </div>

        <div class="plans-list">
          <mat-card
            *ngFor="let plan of group.plans"
            class="plan-card"
            [class.current]="plan.isCurrent"
          >
            <mat-card-header>
              <mat-card-title>{{ plan.name }}</mat-card-title>
              <mat-card-subtitle>{{ plan.effectiveDate }} 生效 · {{ getPriceTypeLabel(plan.priceType) }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="price">¥{{ plan.price }}<span class="unit">/{{ getPriceTypeLabel(plan.priceType) }}</span></div>
              <div class="source">来源：{{ plan.source }}</div>
              <div *ngIf="plan.isCurrent" class="current-tag">
                <mat-icon>check_circle</mat-icon>
                当前生效
              </div>
            </mat-card-content>
            <mat-card-actions *ngIf="!plan.isCurrent">
              <button mat-button color="primary" (click)="onSetCurrent(plan)">设为当前</button>
              <button mat-button color="warn" (click)="onDelete(plan)">删除</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>

      <div *ngIf="groupedPlans.length === 0" class="empty">
        暂无价格方案
      </div>
    </div>
  `,
  styles: [`
    .page-content { padding: 0 24px 24px; }
    .property-filter { width: 250px; margin-bottom: 16px; }
    .property-group { margin-bottom: 24px; }
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    .group-header h3 { margin: 0; font-size: 18px; }
    .current-price { color: #666; }
    .current-price strong { color: #1976d2; font-size: 18px; }

    .plans-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .plan-card { transition: box-shadow 0.2s; }
    .plan-card.current {
      border: 2px solid #1976d2;
      background: #f5faff;
    }
    .price {
      font-size: 28px;
      font-weight: 700;
      color: #1976d2;
      margin: 8px 0;
    }
    .unit { font-size: 14px; font-weight: 400; }
    .source { color: #666; font-size: 13px; }
    .current-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #2e7d32;
      font-size: 13px;
      margin-top: 8px;
    }
    .empty {
      text-align: center;
      color: #999;
      padding: 60px 0;
      background: #fff;
      border-radius: 8px;
    }
    @media (max-width: 768px) {
      .page-content { padding: 0 12px 12px; }
      .property-filter { width: 100%; }
      .plans-list { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .price { font-size: 22px; }
    }
  `]
})
export class PricingComponent implements OnInit {
  private pricingService = inject(PricingService);
  private propertiesService = inject(PropertiesService);
  private exportService = inject(ExportService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  properties: Property[] = [];
  selectedPropertyId: string | null = null;
  allPlans: PricePlan[] = [];
  groupedPlans: any[] = [];

  ngOnInit(): void {
    this.loadProperties();
    this.loadPricings();
  }

  loadProperties(): void {
    this.propertiesService.getProperties({ pageSize: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.properties = response.data.items;
        }
      },
      error: (err) => {
        this.snackBar.open('加载房源失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  loadPricings(): void {
    const params: any = {};
    if (this.selectedPropertyId) {
      params.propertyId = this.selectedPropertyId;
    }

    this.pricingService.getPricings(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.allPlans = response.data.items;
          this.groupPlansByProperty();
        } else {
          this.snackBar.open(response.message || '加载失败', '关闭', { duration: 3000 });
        }
      },
      error: (err) => {
        this.snackBar.open('加载失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  groupPlansByProperty(): void {
    const groups: Record<string, any> = {};

    this.allPlans.forEach(plan => {
      if (!groups[plan.propertyName]) {
        groups[plan.propertyName] = {
          propertyName: plan.propertyName,
          propertyId: plan.propertyId,
          currentPrice: 0,
          currentPriceType: 'monthly',
          plans: []
        };
      }
      groups[plan.propertyName].plans.push(plan);
      if (plan.isCurrent) {
        groups[plan.propertyName].currentPrice = plan.price;
        groups[plan.propertyName].currentPriceType = plan.priceType;
      }
    });

    this.groupedPlans = Object.values(groups);
  }

  onAddPricing(): void {
    const dialogRef = this.dialog.open(PricePlanFormComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: { properties: this.properties }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.pricingService.createPricing(result).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('新增价格方案成功', '关闭', { duration: 2000 });
              this.loadPricings();
            } else {
              this.snackBar.open(response.message || '新增失败', '关闭', { duration: 3000 });
            }
          },
          error: (err) => {
            this.snackBar.open('新增失败：' + (err.message || err), '关闭', { duration: 3000 });
          }
        });
      }
    });
  }

  onSetCurrent(plan: PricePlan): void {
    if (confirm(`确认将 "${plan.name}" 设为当前生效价格？`)) {
      this.pricingService.setCurrentPricing(plan.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('已设置为当前价格', '关闭', { duration: 2000 });
            this.loadPricings();
          } else {
            this.snackBar.open(response.message || '设置失败', '关闭', { duration: 3000 });
          }
        },
        error: (err) => {
          this.snackBar.open('设置失败：' + (err.message || err), '关闭', { duration: 3000 });
        }
      });
    }
  }

  onDelete(plan: PricePlan): void {
    if (confirm(`确认删除价格方案"${plan.name}"吗？`)) {
      this.pricingService.deletePricing(plan.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('删除成功', '关闭', { duration: 2000 });
            this.loadPricings();
          } else {
            this.snackBar.open(response.message || '删除失败', '关闭', { duration: 3000 });
          }
        },
        error: (err) => {
          this.snackBar.open('删除失败：' + (err.message || err), '关闭', { duration: 3000 });
        }
      });
    }
  }

  onExport(): void {
    const filters: Record<string, any> = {};
    if (this.selectedPropertyId) filters['propertyId'] = this.selectedPropertyId;

    this.exportService.exportData('pricing', filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `价格方案_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('导出成功', '关闭', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('导出失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  getPriceTypeLabel(priceType: string): string {
    const map: Record<string, string> = {
      daily: '日',
      weekly: '周',
      monthly: '月',
      yearly: '年'
    };
    return map[priceType] || priceType;
  }
}
