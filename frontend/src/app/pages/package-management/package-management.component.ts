import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { ApiService } from '../../core/services/api.service';
import {
  Package,
  RefundRuleType,
  RefundRuleTypeLabels,
} from '../../core/models/appointment.model';

@Component({
  selector: 'app-package-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './package-management.component.html',
  styleUrls: ['./package-management.component.css'],
})
export class PackageManagementComponent implements OnInit {
  @ViewChild('packageDialog') packageDialogTemplate!: TemplateRef<any>;
  private dialogRef!: MatDialogRef<any>;

  packages: Package[] = [];
  displayedColumns: string[] = [
    'name',
    'price',
    'durationMinutes',
    'sessionCount',
    'refundRuleType',
    'refundDeadlineHours',
    'isActive',
    'actions',
  ];
  refundRuleTypeLabels = RefundRuleTypeLabels;
  refundRuleTypes = Object.values(RefundRuleType);
  isLoading = false;

  getRefundRuleLabel(type: RefundRuleType | string): string {
    return this.refundRuleTypeLabels[type as RefundRuleType] || String(type);
  }
  packageForm: FormGroup;
  isEditMode = false;
  currentPackageId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.packageForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      durationMinutes: [50, [Validators.required, Validators.min(1)]],
      sessionCount: [1, [Validators.required, Validators.min(1)]],
      refundRuleType: [RefundRuleType.FULL_REFUND, Validators.required],
      refundDeadlineHours: [24, [Validators.min(0)]],
      refundPercentage: [100, [Validators.min(0), Validators.max(100)]],
      refundNotes: [''],
      sortOrder: [0, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.isLoading = true;
    this.apiService.getPackages().subscribe({
      next: (packages) => {
        this.packages = packages;
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('加载套餐列表失败', '关闭', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  openCreateDialog(): void {
    this.isEditMode = false;
    this.currentPackageId = null;
    this.packageForm.reset({
      name: '',
      description: '',
      price: 0,
      durationMinutes: 50,
      sessionCount: 1,
      refundRuleType: RefundRuleType.FULL_REFUND,
      refundDeadlineHours: 24,
      refundPercentage: 100,
      refundNotes: '',
      sortOrder: 0,
    });
    this.dialogRef = this.dialog.open(this.packageDialogTemplate, {
      width: '600px',
      disableClose: true,
    });
  }

  openEditDialog(pkg: Package): void {
    this.isEditMode = true;
    this.currentPackageId = pkg.id;
    this.packageForm.patchValue({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      durationMinutes: pkg.durationMinutes,
      sessionCount: pkg.sessionCount,
      refundRuleType: pkg.refundRuleType,
      refundDeadlineHours: pkg.refundDeadlineHours || 0,
      refundPercentage: pkg.refundPercentage || 0,
      refundNotes: pkg.refundNotes || '',
      sortOrder: pkg.sortOrder,
    });
    this.dialogRef = this.dialog.open(this.packageDialogTemplate, {
      width: '600px',
      disableClose: true,
    });
  }

  onSubmit(): void {
    if (this.packageForm.invalid) {
      return;
    }

    const formData = this.packageForm.value;

    if (this.isEditMode && this.currentPackageId) {
      this.apiService
        .updatePackage(this.currentPackageId, formData)
        .subscribe({
          next: () => {
            this.snackBar.open('套餐更新成功', '关闭', { duration: 3000 });
            this.loadPackages();
            this.dialogRef.close();
          },
          error: () => {
            this.snackBar.open('套餐更新失败', '关闭', { duration: 3000 });
          },
        });
    } else {
      this.apiService.createPackage(formData).subscribe({
        next: () => {
          this.snackBar.open('套餐创建成功', '关闭', { duration: 3000 });
          this.loadPackages();
          this.dialogRef.close();
        },
        error: () => {
          this.snackBar.open('套餐创建失败', '关闭', { duration: 3000 });
        },
      });
    }
  }

  toggleStatus(pkg: Package): void {
    this.apiService
      .updatePackage(pkg.id, { isActive: !pkg.isActive })
      .subscribe({
        next: () => {
          this.snackBar.open(
            `套餐已${pkg.isActive ? '禁用' : '启用'}`,
            '关闭',
            { duration: 3000 }
          );
          this.loadPackages();
        },
        error: () => {
          this.snackBar.open('操作失败', '关闭', { duration: 3000 });
        },
      });
  }

  deletePackage(pkg: Package): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '确认删除',
        message: `确定要删除套餐"${pkg.name}"吗？此操作不可撤销。`,
        confirmText: '删除',
        cancelText: '取消',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.deletePackage(pkg.id).subscribe({
          next: () => {
            this.snackBar.open('套餐删除成功', '关闭', { duration: 3000 });
            this.loadPackages();
          },
          error: () => {
            this.snackBar.open('套餐删除失败', '关闭', { duration: 3000 });
          },
        });
      }
    });
  }
}
