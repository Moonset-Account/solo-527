import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { LeasesService } from '../../services/leases.service';
import { ExportService } from '../../services/export.service';
import { Lease, LeaseStatus } from '../../types';
import { LeaseDetailComponent } from './lease-detail.component';

@Component({
  selector: 'app-leases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    PageHeaderComponent,
    DataTableComponent,
    StatusBadgeComponent
  ],
  templateUrl: './leases.component.html',
  styleUrls: ['./leases.component.scss']
})
export class LeasesComponent implements OnInit {
  private leasesService = inject(LeasesService);
  private exportService = inject(ExportService);
  private dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  leases: Lease[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  filters = {
    property: '',
    tenantName: '',
    status: '',
    dateRange: { start: null as Date | null, end: null as Date | null }
  };

  columns: ColumnDef[] = [
    { key: 'leaseNo', label: '租约编号', sortable: true },
    { key: 'propertyName', label: '房源', sortable: true },
    { key: 'tenantName', label: '租客', sortable: true },
    { key: 'startDate', label: '租期开始' },
    { key: 'endDate', label: '租期结束' },
    { key: 'monthlyRent', label: '月租金', type: 'template' },
    { key: 'deposit', label: '押金', type: 'template' },
    { key: 'status', label: '状态', type: 'template' }
  ];

  ngOnInit(): void {
    this.loadLeases();
  }

  loadLeases(): void {
    const params: any = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      tenantName: this.filters.tenantName || undefined,
      status: this.filters.status || undefined
    };

    this.leasesService.getLeases(params).subscribe(response => {
      if (response.success) {
        this.leases = response.data.items;
        this.total = response.data.total;
        this.pageIndex = response.data.page - 1;
        this.pageSize = response.data.pageSize;
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadLeases();
  }

  onReset(): void {
    this.filters = {
      property: '',
      tenantName: '',
      status: '',
      dateRange: { start: null, end: null }
    };
    this.pageIndex = 0;
    this.loadLeases();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLeases();
  }

  async onViewDetail(lease: Lease): Promise<void> {
    try {
      const response = await lastValueFrom(this.leasesService.getLease(lease.id));
      if (response.success) {
        this.dialog.open(LeaseDetailComponent, {
          width: '600px',
          maxWidth: '90vw',
          data: { lease: response.data }
        });
      }
    } catch (error) {
      console.error('获取租约详情失败:', error);
    }
  }

  async onExport(): Promise<void> {
    try {
      const filters = {
        tenantName: this.filters.tenantName || undefined,
        status: this.filters.status || undefined
      };
      const blob = await lastValueFrom(this.exportService.exportData('leases', filters));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leases_${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
    }
  }

  getStatusBadge(status: LeaseStatus): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<LeaseStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      active: 'success',
      pending: 'warning',
      expired: 'info',
      terminated: 'error'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: LeaseStatus): string {
    const map: Record<LeaseStatus, string> = {
      active: '有效',
      expired: '已过期',
      terminated: '已终止',
      pending: '待生效'
    };
    return map[status] || status;
  }

  formatCurrency(value: number): string {
    return `¥${value.toFixed(2)}`;
  }
}
