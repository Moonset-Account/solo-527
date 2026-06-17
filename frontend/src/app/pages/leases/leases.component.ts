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
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { MockDataService } from '../../services/mock-data.service';
import { Lease, Bill, Deposit, SourceRecord, PageResult } from '../../types';
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
  private mockDataService = inject(MockDataService);
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
    { key: 'monthlyRent', label: '月租金' },
    { key: 'deposit', label: '押金' },
    { key: 'status', label: '状态' }
  ];

  ngOnInit(): void {
    this.loadLeases();
  }

  loadLeases(): void {
    const params: any = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      tenantName: this.filters.tenantName,
      status: this.filters.status
    };

    this.mockDataService.getLeases(params).subscribe((result: PageResult<Lease>) => {
      this.leases = result.items;
      this.total = result.total;
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

  onViewDetail(lease: Lease): void {
    this.mockDataService.getLeaseBills(lease.id).subscribe(bills => {
      this.mockDataService.getLeaseDeposits(lease.id).subscribe(deposits => {
        this.mockDataService.getSourceRecords('lease', lease.id).subscribe(sources => {
          this.dialog.open(LeaseDetailComponent, {
            width: '600px',
            maxWidth: '90vw',
            data: { lease, bills, deposits, sources }
          });
        });
      });
    });
  }

  onExport(): void {
    alert('导出功能待实现');
  }

  getStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      active: 'success',
      pending: 'warning',
      expired: 'info',
      terminated: 'error'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: '进行中',
      pending: '待生效',
      expired: '已到期',
      terminated: '已终止'
    };
    return map[status] || status;
  }

  formatCurrency(value: number): string {
    return `¥${value.toLocaleString()}`;
  }
}
