import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { ApiService } from '../../core/services/api.service';
import { Counselor } from '../../core/models/appointment.model';

@Component({
  selector: 'app-counselor-management',
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
    MatSlideToggleModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './counselor-management.component.html',
  styleUrls: ['./counselor-management.component.css'],
})
export class CounselorManagementComponent implements OnInit {
  @ViewChild('counselorDialog') counselorDialogTemplate!: TemplateRef<any>;
  private dialogRef!: MatDialogRef<any>;

  counselors: Counselor[] = [];
  displayedColumns: string[] = [
    'name',
    'title',
    'yearsOfExperience',
    'specialties',
    'isActive',
    'actions',
  ];
  isLoading = false;
  counselorForm: FormGroup;
  isEditMode = false;
  currentCounselorId: string | null = null;
  specialtyInput = new FormControl('');
  specialties: string[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.counselorForm = this.fb.group({
      name: ['', Validators.required],
      title: ['', Validators.required],
      avatar: [''],
      description: [''],
      yearsOfExperience: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.loadCounselors();
  }

  loadCounselors(): void {
    this.isLoading = true;
    this.apiService.getCounselors().subscribe({
      next: (counselors) => {
        this.counselors = counselors;
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('加载咨询师列表失败', '关闭', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  openCreateDialog(): void {
    this.isEditMode = false;
    this.currentCounselorId = null;
    this.specialties = [];
    this.specialtyInput.setValue('');
    this.counselorForm.reset({
      name: '',
      title: '',
      avatar: '',
      description: '',
      yearsOfExperience: 0,
      isActive: true,
    });
    this.dialogRef = this.dialog.open(this.counselorDialogTemplate, {
      width: '600px',
      disableClose: true,
    });
  }

  openEditDialog(counselor: Counselor): void {
    this.isEditMode = true;
    this.currentCounselorId = counselor.id;
    this.specialties = [...(counselor.specialties || [])];
    this.specialtyInput.setValue('');
    this.counselorForm.patchValue({
      name: counselor.name,
      title: counselor.title,
      avatar: counselor.avatar || '',
      description: counselor.description || '',
      yearsOfExperience: counselor.yearsOfExperience,
      isActive: counselor.isActive,
    });
    this.dialogRef = this.dialog.open(this.counselorDialogTemplate, {
      width: '600px',
      disableClose: true,
    });
  }

  addSpecialty(): void {
    const value = (this.specialtyInput.value || '').trim();
    if (value && !this.specialties.includes(value)) {
      this.specialties.push(value);
      this.specialtyInput.setValue('');
    }
  }

  removeSpecialty(specialty: string): void {
    const index = this.specialties.indexOf(specialty);
    if (index >= 0) {
      this.specialties.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.counselorForm.invalid) {
      return;
    }

    const formData = {
      ...this.counselorForm.value,
      specialties: this.specialties,
    };

    if (this.isEditMode && this.currentCounselorId) {
      this.apiService
        .updateCounselor(this.currentCounselorId, formData)
        .subscribe({
          next: () => {
            this.snackBar.open('咨询师更新成功', '关闭', { duration: 3000 });
            this.loadCounselors();
            this.dialogRef.close();
          },
          error: () => {
            this.snackBar.open('咨询师更新失败', '关闭', { duration: 3000 });
          },
        });
    } else {
      this.apiService.createCounselor(formData).subscribe({
        next: () => {
          this.snackBar.open('咨询师创建成功', '关闭', { duration: 3000 });
          this.loadCounselors();
          this.dialogRef.close();
        },
        error: () => {
          this.snackBar.open('咨询师创建失败', '关闭', { duration: 3000 });
        },
      });
    }
  }

  toggleStatus(counselor: Counselor): void {
    this.apiService
      .updateCounselor(counselor.id, { isActive: !counselor.isActive })
      .subscribe({
        next: () => {
          this.snackBar.open(
            `咨询师已${counselor.isActive ? '禁用' : '启用'}`,
            '关闭',
            { duration: 3000 }
          );
          this.loadCounselors();
        },
        error: () => {
          this.snackBar.open('操作失败', '关闭', { duration: 3000 });
        },
      });
  }

  deleteCounselor(counselor: Counselor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '确认删除',
        message: `确定要删除咨询师"${counselor.name}"吗？此操作不可撤销。`,
        confirmText: '删除',
        cancelText: '取消',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService.deleteCounselor(counselor.id).subscribe({
          next: () => {
            this.snackBar.open('咨询师删除成功', '关闭', { duration: 3000 });
            this.loadCounselors();
          },
          error: () => {
            this.snackBar.open('咨询师删除失败', '关闭', { duration: 3000 });
          },
        });
      }
    });
  }
}
