import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ChargeService, Charge } from '../../../core/services/charge.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-charge-list',
  templateUrl: './charge-list.component.html',
  styleUrls: ['./charge-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChargeListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  displayedColumns: string[] = ['id', 'chargeNo', 'patientName', 'totalAmount', 'actualAmount', 'paymentMethod', 'status', 'chargedByName', 'chargedAt', 'actions'];
  dataSource = new MatTableDataSource<Charge>([]);
  total = 0;
  page = 1;
  pageSize = 10;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  paymentMethods = [
    { value: 'cash', label: '现金' },
    { value: 'wechat', label: '微信' },
    { value: 'alipay', label: '支付宝' },
    { value: 'card', label: '银行卡' },
    { value: 'insurance', label: '医保' },
    { value: 'other', label: '其他' }
  ];

  statusOptions = [
    { value: 'pending', label: '待支付' },
    { value: 'paid', label: '已支付' },
    { value: 'refunded', label: '已退款' },
    { value: 'cancelled', label: '已取消' }
  ];

  constructor(
    private fb: FormBuilder,
    private chargeService: ChargeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      chargeNo: [''],
      patientName: [''],
      paymentMethod: [''],
      status: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadCharges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCharges(): void {
    const filters = this.filterForm.value;
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    if (filters.startDate) {
      filters.startDate = new Date(filters.startDate).toISOString().split('T')[0];
    }
    if (filters.endDate) {
      filters.endDate = new Date(filters.endDate).toISOString().split('T')[0];
    }

    this.chargeService.getCharges(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.dataSource.data = response.data;
        this.total = response.total;
      });
  }

  onSearch(): void {
    this.page = 1;
    this.loadCharges();
  }

  onReset(): void {
    this.filterForm.reset();
    this.page = 1;
    this.loadCharges();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCharges();
  }

  onEdit(id: number): void {
    this.router.navigate(['../', id], { relativeTo: this.route });
  }

  onView(id: number): void {
    this.router.navigate(['../', id], { relativeTo: this.route });
  }

  onRefund(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '确认退款',
        message: '确定要对这笔收费单进行退款操作吗？',
        confirmText: '确认退款',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.chargeService.refundCharge(id, '用户申请退款')
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.snackBar.open('退款成功', '关闭', { duration: 3000 });
              this.loadCharges();
            });
        }
      });
  }

  onUpdateStatus(id: number, status: string): void {
    this.chargeService.updateStatus(id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('状态更新成功', '关闭', { duration: 3000 });
        this.loadCharges();
      });
  }

  getPaymentMethodLabel(method: string): string {
    return this.paymentMethods.find(m => m.value === method)?.label || method;
  }
}
