import { Component, OnInit, ViewChild, AfterViewInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CollectionService } from '../../services/collection.service';
import { CollectionRhythm } from '../../services/api.config';


@Component({
  selector: 'app-collection-rhythms',
  template: `
    <div class="rhythms-container">
      <mat-card class="table-card">
        <div class="table-header">
          <div>
            <mat-card-title>催收节奏配置</mat-card-title>
            <mat-card-subtitle>管理催收流程的自动化规则和通知策略</mat-card-subtitle>
          </div>
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon>
            新增节奏
          </button>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="dataSource" matSort class="rhythms-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>名称</th>
              <td mat-cell *matCellDef="let rhythm">{{ rhythm.name }}</td>
            </ng-container>
            <ng-container matColumnDef="daysOverdue">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>逾期天数</th>
              <td mat-cell *matCellDef="let rhythm">
                <span class="days-badge">{{ rhythm.daysOverdue }} 天</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="severity">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>严重程度</th>
              <td mat-cell *matCellDef="let rhythm">
                <span [ngClass]="getSeverityClass(rhythm.severity)" class="severity-badge">
                  {{ rhythm.severity | statusDisplay }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="channel">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>渠道</th>
              <td mat-cell *matCellDef="let rhythm">
                <mat-icon class="channel-icon">{{ getChannelIcon(rhythm.channel) }}</mat-icon>
                {{ rhythm.channel | statusDisplay }}
              </td>
            </ng-container>
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>优先级</th>
              <td mat-cell *matCellDef="let rhythm">
                <mat-chip-listbox>
                  <mat-chip color="primary" highlighted>{{ rhythm.priority }}</mat-chip>
                </mat-chip-listbox>
              </td>
            </ng-container>
            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>状态</th>
              <td mat-cell *matCellDef="let rhythm">
                <mat-slide-toggle
                  [checked]="rhythm.isActive"
                  (change)="toggleStatus(rhythm)"
                  color="primary">
                </mat-slide-toggle>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>操作</th>
              <td mat-cell *matCellDef="let rhythm">
                <button mat-icon-button color="primary" matTooltip="编辑" (click)="openDialog(rhythm)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="删除" (click)="deleteRhythm(rhythm)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10, 20, 50, 100]" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .rhythms-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .table-card {
      flex: 1;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .table-container {
      overflow-x: auto;
    }
    .rhythms-table {
      width: 100%;
    }
    .days-badge {
      background: #f5f5f5;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .severity-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .severity-reminder {
      background: #e3f2fd;
      color: #1565c0;
    }
    .severity-warning {
      background: #fff3e0;
      color: #e65100;
    }
    .severity-urgent {
      background: #ffebee;
      color: #c62828;
    }
    .severity-legal {
      background: #fce4ec;
      color: #880e4f;
    }
    .channel-icon {
      font-size: 18px;
      margin-right: 8px;
      vertical-align: middle;
    }
    .mat-mdc-header-cell {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }
    .mat-mdc-cell {
      padding: 8px 16px 8px 0;
    }
  `]
})
export class CollectionRhythmsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'daysOverdue', 'severity', 'channel', 'priority', 'isActive', 'actions'];
  dataSource = new MatTableDataSource<CollectionRhythm>([]);
  totalCount = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private collectionService: CollectionService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRhythms();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.paginator.page.subscribe(() => {
      this.loadRhythms();
    });

    this.sort.sortChange.subscribe(() => {
      this.loadRhythms();
    });
  }

  loadRhythms(): void {
    const filters = {
      page: this.paginator?.pageIndex ? this.paginator.pageIndex + 1 : 1,
      limit: this.paginator?.pageSize || 10,
      sortBy: this.sort?.active || '',
      sortOrder: this.sort?.direction || '',
    };

    this.collectionService.findAllRhythms(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalCount = response.total;
        this.paginator.length = this.totalCount;
      },
      error: (error) => {
        console.error('Failed to load rhythms:', error);
      }
    });
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity}`;
  }

  getChannelIcon(channel: string): string {
    const icons: Record<string, string> = {
      email: 'email',
      sms: 'sms',
      phone: 'phone',
      letter: 'description',
      in_person: 'person'
    };
    return icons[channel] || 'notifications';
  }

  toggleStatus(rhythm: CollectionRhythm): void {
    const updatedData = { ...rhythm, isActive: !rhythm.isActive };
    this.collectionService.updateRhythm(rhythm.id, updatedData).subscribe({
      next: () => {
        this.loadRhythms();
      },
      error: (error) => {
        console.error('Failed to toggle rhythm status:', error);
      }
    });
  }

  openDialog(rhythm?: CollectionRhythm): void {
    const dialogRef = this.dialog.open(CollectionRhythmDialogComponent, {
      width: '800px',
      data: rhythm
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRhythms();
      }
    });
  }

  deleteRhythm(rhythm: CollectionRhythm): void {
    console.log('Delete rhythm:', rhythm);
  }
}

@Component({
  selector: 'app-collection-rhythm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data ? '编辑节奏' : '新增节奏' }}</h2>
    <form [formGroup]="rhythmForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>名称</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="rhythmForm.get('name')?.hasError('required')">
              请输入名称
            </mat-error>
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>逾期天数</mat-label>
            <input matInput type="number" formControlName="daysOverdue" required>
            <mat-error *ngIf="rhythmForm.get('daysOverdue')?.hasError('required')">
              请输入逾期天数
            </mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="fill" class="form-field full-width">
          <mat-label>描述</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>严重程度</mat-label>
            <mat-select formControlName="severity" required>
              <mat-option value="reminder">提醒</mat-option>
              <mat-option value="warning">警告</mat-option>
              <mat-option value="urgent">紧急</mat-option>
              <mat-option value="legal">法务</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>渠道</mat-label>
            <mat-select formControlName="channel" required>
              <mat-option value="email">邮件</mat-option>
              <mat-option value="sms">短信</mat-option>
              <mat-option value="phone">电话</mat-option>
              <mat-option value="letter">信函</mat-option>
              <mat-option value="in_person">上门</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>优先级</mat-label>
            <input matInput type="number" formControlName="priority">
          </mat-form-field>
        </div>

        <mat-form-field appearance="fill" class="form-field full-width">
          <mat-label>主题</mat-label>
          <input matInput formControlName="subject">
        </mat-form-field>

        <mat-form-field appearance="fill" class="form-field full-width">
          <mat-label>消息模板</mat-label>
          <textarea matInput formControlName="template" rows="5" required></textarea>
          <mat-hint>使用 {{customerName}}、{{billNumber}}、{{amount}} 等变量</mat-hint>
          <mat-error *ngIf="rhythmForm.get('template')?.hasError('required')">
            请输入消息模板
          </mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-slide-toggle formControlName="isActive" color="primary">
            是否启用
          </mat-slide-toggle>
        </div>

        <mat-divider></mat-divider>

        <div class="escalation-section">
          <h3>升级规则</h3>
          <div formArrayName="escalationRules">
            <div *ngFor="let rule of escalationRules.controls; let i = index" [formGroupName]="i" class="escalation-rule">
              <div class="form-row">
                <mat-form-field appearance="fill" class="form-field">
                  <mat-label>升级天数</mat-label>
                  <input matInput type="number" formControlName="afterDays">
                </mat-form-field>
                <mat-form-field appearance="fill" class="form-field">
                  <mat-label>下一节奏</mat-label>
                  <mat-select formControlName="nextRhythmId">
                    <mat-option value="">选择节奏</mat-option>
                    <mat-option *ngFor="let r of rhythms" [value]="r.id">
                      {{ r.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-checkbox formControlName="autoEscalate">自动升级</mat-checkbox>
                <button mat-icon-button color="warn" (click)="removeEscalationRule(i)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
            <button mat-button type="button" (click)="addEscalationRule()">
              <mat-icon>add</mat-icon>
              添加升级规则
            </button>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>取消</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!rhythmForm.valid">
          {{ data ? '保存' : '创建' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content {
      padding: 24px 0;
    }
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      align-items: center;
    }
    .form-field {
      flex: 1;
      min-width: 200px;
    }
    .full-width {
      width: 100%;
    }
    .escalation-section {
      margin-top: 24px;
    }
    .escalation-section h3 {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .escalation-rule {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    mat-divider {
      margin: 24px 0;
    }
  `]
})
export class CollectionRhythmDialogComponent implements OnInit {
  rhythmForm: FormGroup;
  rhythms: CollectionRhythm[] = [];

  constructor(
    private fb: FormBuilder,
    private collectionService: CollectionService,
    public dialogRef: MatDialogRef<CollectionRhythmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CollectionRhythm | null
  ) {
    this.rhythmForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      daysOverdue: [0, Validators.required],
      severity: ['reminder', Validators.required],
      channel: ['email', Validators.required],
      subject: [''],
      template: ['', Validators.required],
      priority: [0],
      isActive: [true],
      escalationRules: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadRhythms();

    if (this.data) {
      this.rhythmForm.patchValue({
        name: this.data.name,
        description: this.data.description,
        daysOverdue: this.data.daysOverdue,
        severity: this.data.severity,
        channel: this.data.channel,
        subject: this.data.subject,
        template: this.data.template,
        priority: this.data.priority,
        isActive: this.data.isActive
      });

      if (this.data.escalationRules && this.data.escalationRules.length > 0) {
        this.data.escalationRules.forEach(rule => {
          this.addEscalationRule(rule);
        });
      }
    }
  }

  get escalationRules(): FormArray {
    return this.rhythmForm.get('escalationRules') as FormArray;
  }

  addEscalationRule(rule?: any): void {
    this.escalationRules.push(this.fb.group({
      afterDays: [rule?.afterDays || 0],
      nextRhythmId: [rule?.nextRhythmId || ''],
      autoEscalate: [rule?.autoEscalate || false]
    }));
  }

  removeEscalationRule(index: number): void {
    this.escalationRules.removeAt(index);
  }

  loadRhythms(): void {
    this.collectionService.findAllRhythms({ limit: 100 }).subscribe({
      next: (response) => {
        this.rhythms = response.data;
        if (this.data) {
          this.rhythms = this.rhythms.filter(r => r.id !== this.data?.id);
        }
      },
      error: (error) => {
        console.error('Failed to load rhythms:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.rhythmForm.invalid) return;

    const formValue = this.rhythmForm.value;
    const cleanRules = formValue.escalationRules.filter((rule: any) => rule.nextRhythmId);
    formValue.escalationRules = cleanRules;

    if (this.data) {
      this.collectionService.updateRhythm(this.data.id, formValue).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Failed to update rhythm:', error);
        }
      });
    } else {
      this.collectionService.createRhythm(formValue).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Failed to create rhythm:', error);
        }
      });
    }
  }
}
