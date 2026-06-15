import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { InspectionTemplatesService } from '../services/inspection-templates.service';
import { InspectionTemplate } from '../models/inspection-template.model';

@Component({
  selector: 'app-inspection-templates',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './inspection-templates.component.html',
  styleUrls: ['./inspection-templates.component.scss'],
})
export class InspectionTemplatesComponent implements OnInit {
  templates: InspectionTemplate[] = [];
  loading = true;
  displayedColumns: string[] = ['name', 'description', 'frequency', 'isActive', 'createdBy', 'createdAt'];

  constructor(
    private templatesService: InspectionTemplatesService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.templatesService.getAll().subscribe({
      next: (data) => {
        this.templates = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/inspection-templates', id]);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TemplateCreateDialogComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.templatesService.create(result).subscribe({
          next: () => {
            this.snackBar.open('模板创建成功', '关闭', { duration: 3000 });
            this.loadTemplates();
          },
          error: () => {
            this.snackBar.open('创建失败', '关闭', { duration: 3000 });
          },
        });
      }
    });
  }

  getFrequencyLabel(frequency: string): string {
    const map: Record<string, string> = {
      DAILY: '每日',
      WEEKLY: '每周',
      MONTHLY: '每月',
      QUARTERLY: '每季度',
    };
    return map[frequency] || frequency;
  }
}

@Component({
  selector: 'app-template-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>新建巡检模板</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>模板名称</mat-label>
          <input matInput formControlName="name" />
          <mat-error *ngIf="form.get('name')?.hasError('required')">请输入模板名称</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>描述</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>巡检频率</mat-label>
            <mat-select formControlName="frequency">
              @for (opt of frequencyOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
            <mat-error *ngIf="form.get('frequency')?.hasError('required')">请选择频率</mat-error>
          </mat-form-field>

          <div class="half-width toggle-row">
            <label class="toggle-label">启用状态</label>
            <mat-slide-toggle formControlName="isActive" color="primary">
              {{ form.get('isActive')?.value ? '启用' : '停用' }}
            </mat-slide-toggle>
          </div>
        </div>

        <div class="items-section">
          <div class="items-header">
            <h4>巡检项</h4>
            <button mat-stroked-button color="primary" type="button" (click)="addItem()">
              <mat-icon>add</mat-icon> 添加巡检项
            </button>
          </div>

          <div formArrayName="items" class="items-list">
            @for (item of items.controls; track $index) {
              <div [formGroupName]="$index" class="item-row">
                <mat-form-field appearance="outline" class="item-name">
                  <mat-label>巡检项名称</mat-label>
                  <input matInput formControlName="name" />
                  <mat-error *ngIf="item.get('name')?.hasError('required')">必填</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="item-type">
                  <mat-label>类型</mat-label>
                  <mat-select formControlName="type">
                    @for (opt of typeOptions; track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <div class="item-required">
                  <mat-slide-toggle formControlName="required" color="primary">必填</mat-slide-toggle>
                </div>

                <mat-form-field appearance="outline" class="item-options">
                  <mat-label>选项 (逗号分隔)</mat-label>
                  <input matInput formControlName="optionsStr" placeholder="例如: 正常,异常,告警" />
                </mat-form-field>

                <button mat-icon-button color="warn" type="button" (click)="removeItem($index)" matTooltip="删除">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }

            <div class="empty-items" *ngIf="items.length === 0">
              <mat-icon>list_alt</mat-icon>
              <span>暂无巡检项，点击上方按钮添加</span>
            </div>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" (click)="confirm()" [disabled]="form.invalid">创建</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    .full-width { width: 100%; }
    .form-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .half-width {
      flex: 1;
      min-width: 0;
    }
    .toggle-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .toggle-label {
      font-size: 12px;
      color: #606266;
    }
    .items-section {
      margin-top: 8px;
      border-top: 1px solid #ebeef5;
      padding-top: 12px;
    }
    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .items-header h4 {
      margin: 0;
      font-size: 14px;
      color: #303133;
    }
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .item-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 10px;
      background: #f5f7fa;
      border-radius: 6px;
    }
    .item-name { flex: 2; min-width: 0; }
    .item-type { flex: 1.2; min-width: 120px; }
    .item-required {
      padding: 12px 8px;
      flex-shrink: 0;
    }
    .item-options { flex: 1.5; min-width: 0; }
    .empty-items {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 16px;
      color: #909399;
      background: #fafafa;
      border-radius: 6px;
    }
  `],
})
export class TemplateCreateDialogComponent {
  form: FormGroup;

  frequencyOptions = [
    { value: 'DAILY', label: '每日' },
    { value: 'WEEKLY', label: '每周' },
    { value: 'MONTHLY', label: '每月' },
    { value: 'QUARTERLY', label: '每季度' },
  ];

  typeOptions = [
    { value: 'BOOLEAN', label: '布尔值(是/否)' },
    { value: 'SELECT', label: '单选' },
    { value: 'MULTI_SELECT', label: '多选' },
    { value: 'TEXT', label: '文本输入' },
    { value: 'NUMBER', label: '数值' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TemplateCreateDialogComponent>,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      frequency: ['DAILY', Validators.required],
      isActive: [true],
      items: this.fb.array([]),
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      type: ['BOOLEAN', Validators.required],
      required: [true],
      optionsStr: [''],
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  confirm(): void {
    if (this.form.invalid) return;

    const rawValue = this.form.value;
    const items = rawValue.items.map((item: any) => {
      const options = item.optionsStr
        ? item.optionsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s)
        : undefined;
      return {
        name: item.name,
        type: item.type,
        required: item.required,
        options,
      };
    });

    const payload = {
      name: rawValue.name,
      description: rawValue.description,
      frequency: rawValue.frequency,
      isActive: rawValue.isActive,
      items,
    };

    this.dialogRef.close(payload);
  }
}
