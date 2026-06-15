import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaultsService } from '../../services/faults.service';
import { ChangeWindowsService } from '../../services/change-windows.service';
import { ProcessingRecordsService } from '../../services/processing-records.service';
import { Fault } from '../../models/fault.model';
import { ChangeWindow } from '../../models/change-window.model';
import { ProcessingRecord } from '../../models/processing-record.model';

@Component({
  selector: 'app-fault-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './fault-detail.component.html',
  styleUrls: ['./fault-detail.component.scss'],
})
export class FaultDetailComponent implements OnInit {
  fault: Fault | null = null;
  changeWindows: ChangeWindow[] = [];
  processingRecords: ProcessingRecord[] = [];
  loading = true;
  editMode = false;
  form!: FormGroup;

  displayedChangeWindowColumns: string[] = ['startTime', 'endTime', 'status', 'approvedBy', 'description'];
  displayedRecordColumns: string[] = ['action', 'operatorName', 'previousValue', 'newValue', 'details', 'createdAt'];

  statusOptions = [
    { value: 'OPEN', label: '待处理' },
    { value: 'IN_PROGRESS', label: '处理中' },
    { value: 'RESOLVED', label: '已解决' },
    { value: 'CLOSED', label: '已关闭' },
  ];

  severityOptions = [
    { value: 'CRITICAL', label: '严重' },
    { value: 'HIGH', label: '高' },
    { value: 'MEDIUM', label: '中' },
    { value: 'LOW', label: '低' },
  ];

  private id = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private faultsService: FaultsService,
    private changeWindowsService: ChangeWindowsService,
    private processingRecordsService: ProcessingRecordsService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.loadFault();
    this.loadChangeWindows();
    this.loadProcessingRecords();
  }

  loadFault(): void {
    this.loading = true;
    this.faultsService.getById(this.id).subscribe({
      next: (data) => {
        this.fault = data;
        this.buildForm(data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('加载故障详情失败', '关闭', { duration: 3000 });
      },
    });
  }

  loadChangeWindows(): void {
    this.changeWindowsService.getByEntity('fault', this.id).subscribe({
      next: (data) => {
        this.changeWindows = data;
      },
    });
  }

  loadProcessingRecords(): void {
    this.processingRecordsService.getByEntity('fault', this.id).subscribe({
      next: (data) => {
        this.processingRecords = data;
      },
    });
  }

  buildForm(fault: Fault): void {
    this.form = this.fb.group({
      title: [fault.title, Validators.required],
      reporterName: [fault.reporterName, Validators.required],
      severity: [fault.severity, Validators.required],
      status: [fault.status, Validators.required],
      responsiblePerson: [fault.responsiblePerson, Validators.required],
      description: [fault.description],
      department: [fault.department],
      systemName: [fault.systemName],
      resolution: [fault.resolution],
    });
  }

  toggleEditMode(): void {
    if (this.editMode && this.fault) {
      this.buildForm(this.fault);
    }
    this.editMode = !this.editMode;
  }

  save(): void {
    if (this.form.invalid) return;
    const oldResponsible = this.fault?.responsiblePerson;
    const newResponsible = this.form.value.responsiblePerson;

    if (oldResponsible && newResponsible && oldResponsible !== newResponsible) {
      this.showResponsibleChangeDialog(newResponsible);
      return;
    }

    this.faultsService.update(this.id, this.form.value).subscribe({
      next: (updated) => {
        this.fault = updated;
        this.editMode = false;
        this.snackBar.open('保存成功', '关闭', { duration: 3000 });
        this.loadProcessingRecords();
      },
      error: () => {
        this.snackBar.open('保存失败', '关闭', { duration: 3000 });
      },
    });
  }

  resolveFault(): void {
    if (this.fault?.alertStatus === 'ACTIVE') {
      this.showResolveWithAlertDialog();
      return;
    }
    this.doResolve();
  }

  doResolve(): void {
    this.faultsService.resolve(this.id, { resolution: this.form.value.resolution || '' }).subscribe({
      next: (updated) => {
        this.fault = updated;
        this.snackBar.open('故障已解决', '关闭', { duration: 3000 });
        this.loadProcessingRecords();
      },
      error: () => {
        this.snackBar.open('解决失败', '关闭', { duration: 3000 });
      },
    });
  }

  showResolveWithAlertDialog(): void {
    const dialogRef = this.dialog.open(FaultResolveDialogComponent, {
      width: '450px',
      data: { alertStatus: this.fault?.alertStatus },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.faultsService.resolve(this.id, { resolution: result.resolution || this.form.value.resolution || '' }).subscribe({
          next: (updated) => {
            this.fault = updated;
            this.snackBar.open('故障已解决，审计记录已添加', '关闭', { duration: 3000 });
            this.loadProcessingRecords();
          },
          error: () => {
            this.snackBar.open('解决失败', '关闭', { duration: 3000 });
          },
        });
      }
    });
  }

  showResponsibleChangeDialog(newResponsible: string): void {
    const dialogRef = this.dialog.open(FaultResponsibleChangeDialogComponent, {
      width: '400px',
      data: { newResponsible },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const previousResponsible = this.fault?.responsiblePerson || '';
        this.faultsService.update(this.id, {
          ...this.form.value,
          responsiblePerson: result.newResponsible || newResponsible,
          reason: result.reason,
          operatorName: result.operatorName,
        }).subscribe({
          next: (updated) => {
            this.fault = updated;
            this.editMode = false;
            this.processingRecordsService.create({
              entityType: 'fault',
              entityId: this.id,
              action: '变更负责人',
              operator: '',
              operatorName: result.operatorName,
              details: result.reason,
              previousValue: previousResponsible,
              newValue: result.newResponsible || newResponsible,
            }).subscribe();
            this.snackBar.open('保存成功', '关闭', { duration: 3000 });
            this.loadProcessingRecords();
          },
          error: () => {
            this.snackBar.open('保存失败', '关闭', { duration: 3000 });
          },
        });
      }
    });
  }

  addChangeWindow(): void {
    this.changeWindowsService.create({
      entityType: 'fault',
      entityId: this.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      status: 'PENDING',
      description: '',
    }).subscribe({
      next: () => {
        this.loadChangeWindows();
        this.snackBar.open('变更窗口已添加', '关闭', { duration: 3000 });
      },
    });
  }

  addProcessingRecord(): void {
    this.processingRecordsService.create({
      entityType: 'fault',
      entityId: this.id,
      action: '备注',
      operator: '',
      operatorName: '',
      details: '',
      previousValue: '',
      newValue: '',
    }).subscribe({
      next: () => {
        this.loadProcessingRecords();
        this.snackBar.open('处理记录已添加', '关闭', { duration: 3000 });
      },
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: '待处理', IN_PROGRESS: '处理中', RESOLVED: '已解决', CLOSED: '已关闭',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  getSeverityLabel(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: '严重', HIGH: '高', MEDIUM: '中', LOW: '低',
    };
    return map[severity] || severity;
  }

  getSeverityClass(severity: string): string {
    return 'severity-' + severity.toLowerCase();
  }

  goBack(): void {
    this.router.navigate(['/faults']);
  }
}

@Component({
  selector: 'app-fault-resolve-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>确认解决故障</h2>
    <mat-dialog-content>
      <div class="alert-warning">
        <mat-icon color="warn">warning</mat-icon>
        <span>此故障仍有活跃告警，请确认已处理相关告警后再解决。</span>
      </div>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>解决方案</mat-label>
        <textarea matInput [formControl]="resolutionControl" rows="3"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>审计备注</mat-label>
        <textarea matInput [formControl]="auditNoteControl" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="warn" (click)="confirm()">确认解决</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .alert-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fff3e0;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 14px;
    }
  `],
})
export class FaultResolveDialogComponent {
  resolutionControl = new FormControl('', Validators.required);
  auditNoteControl = new FormControl('');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { alertStatus: string },
    private dialogRef: MatDialogRef<FaultResolveDialogComponent>,
  ) {}

  confirm(): void {
    if (this.resolutionControl.valid) {
      this.dialogRef.close({
        resolution: this.resolutionControl.value,
        auditNote: this.auditNoteControl.value,
      });
    }
  }
}

@Component({
  selector: 'app-fault-responsible-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>变更负责人</h2>
    <mat-dialog-content>
      <p>新负责人: <strong>{{ data.newResponsible }}</strong></p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>操作人姓名</mat-label>
        <input matInput [formControl]="operatorNameControl" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>变更原因</mat-label>
        <textarea matInput [formControl]="reasonControl" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" (click)="confirm()" [disabled]="operatorNameControl.invalid || reasonControl.invalid">确认变更</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class FaultResponsibleChangeDialogComponent {
  operatorNameControl = new FormControl('', Validators.required);
  reasonControl = new FormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { newResponsible: string },
    private dialogRef: MatDialogRef<FaultResponsibleChangeDialogComponent>,
  ) {}

  confirm(): void {
    if (this.operatorNameControl.valid && this.reasonControl.valid) {
      this.dialogRef.close({
        operatorName: this.operatorNameControl.value,
        reason: this.reasonControl.value,
      });
    }
  }
}
