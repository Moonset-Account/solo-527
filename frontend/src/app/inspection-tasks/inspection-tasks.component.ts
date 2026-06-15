import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormControl, FormsModule, Validators } from '@angular/forms';
import { InspectionTasksService } from '../services/inspection-tasks.service';
import { InspectionTemplatesService } from '../services/inspection-templates.service';
import { InspectionTask } from '../models/inspection-task.model';
import { InspectionTemplate } from '../models/inspection-template.model';

@Component({
  selector: 'app-inspection-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './inspection-tasks.component.html',
  styleUrls: ['./inspection-tasks.component.scss'],
})
export class InspectionTasksComponent implements OnInit {
  tasks: InspectionTask[] = [];
  templates: InspectionTemplate[] = [];
  loading = true;
  statusFilter = '';

  displayedColumns: string[] = ['templateName', 'assignee', 'status', 'startedAt', 'completedAt', 'createdAt'];

  statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'PENDING', label: '待执行' },
    { value: 'IN_PROGRESS', label: '执行中' },
    { value: 'COMPLETED', label: '已完成' },
  ];

  constructor(
    private tasksService: InspectionTasksService,
    private templatesService: InspectionTemplatesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadTemplates();
  }

  loadTasks(): void {
    this.loading = true;
    this.tasksService.getAll({ status: this.statusFilter || undefined }).subscribe({
      next: (data) => {
        this.tasks = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadTemplates(): void {
    this.templatesService.getAll().subscribe({
      next: (data) => {
        this.templates = data.filter((t) => t.isActive);
      },
    });
  }

  onFilterChange(): void {
    this.loadTasks();
  }

  openGenerateDialog(): void {
    const dialogRef = this.dialog.open(GenerateTaskDialogComponent, {
      width: '400px',
      data: { templates: this.templates },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.tasksService.generateFromTemplate(result.templateId, result.assignee).subscribe({
          next: () => {
            this.snackBar.open('巡检任务已生成', '关闭', { duration: 3000 });
            this.loadTasks();
          },
          error: () => {
            this.snackBar.open('生成失败', '关闭', { duration: 3000 });
          },
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: '待执行', IN_PROGRESS: '执行中', COMPLETED: '已完成',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }
}

@Component({
  selector: 'app-generate-task-dialog',
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
  ],
  template: `
    <h2 mat-dialog-title>生成巡检任务</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>选择模板</mat-label>
        <mat-select [formControl]="templateControl">
          @for (tpl of data.templates; track tpl.id) {
            <mat-option [value]="tpl.id">{{ tpl.name }}</mat-option>
          }
        </mat-select>
        <mat-error *ngIf="templateControl.hasError('required')">请选择模板</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>指派人</mat-label>
        <input matInput [formControl]="assigneeControl" />
        <mat-error *ngIf="assigneeControl.hasError('required')">请输入指派人</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" (click)="confirm()" [disabled]="templateControl.invalid || assigneeControl.invalid">生成</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class GenerateTaskDialogComponent {
  templateControl = new FormControl('', Validators.required);
  assigneeControl = new FormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { templates: InspectionTemplate[] },
    private dialogRef: MatDialogRef<GenerateTaskDialogComponent>,
  ) {}

  confirm(): void {
    if (this.templateControl.valid && this.assigneeControl.valid) {
      this.dialogRef.close({
        templateId: this.templateControl.value,
        assignee: this.assigneeControl.value,
      });
    }
  }
}
