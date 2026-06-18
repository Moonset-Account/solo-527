import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { Counselor, Package } from '../../core/models/appointment.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
})
export class BookingComponent implements OnInit {
  counselors: Counselor[] = [];
  packages: Package[] = [];
  selectedCounselor: Counselor | null = null;
  selectedPackage: Package | null = null;
  isLoading = true;
  isSubmitting = false;

  counselorForm: FormGroup;
  packageForm: FormGroup;
  appointmentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.counselorForm = this.fb.group({
      counselorId: ['', Validators.required],
    });

    this.packageForm = this.fb.group({
      packageId: ['', Validators.required],
    });

    this.appointmentForm = this.fb.group({
      clientName: ['', [Validators.required, Validators.minLength(2)]],
      clientPhone: ['', [Validators.required, Validators.pattern(/^1[3-9]\d{9}$/)]],
      clientEmail: ['', [Validators.email]],
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getCounselors(true).subscribe({
      next: (counselors) => {
        this.counselors = counselors;
      },
      error: () => {
        this.counselors = [
          {
            id: '1',
            name: '张医生',
            title: '高级心理咨询师',
            description: '拥有10年临床心理咨询经验，擅长认知行为疗法，在焦虑、抑郁等情绪障碍方面有丰富的治疗经验。',
            specialties: ['焦虑抑郁', '情绪管理', '认知行为'],
            yearsOfExperience: 10,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: '李医生',
            title: '资深心理治疗师',
            description: '专注于青少年心理健康和家庭关系咨询，帮助众多家庭重建和谐关系。',
            specialties: ['青少年', '家庭关系', '亲子沟通'],
            yearsOfExperience: 8,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '3',
            name: '王医生',
            title: '注册心理师',
            description: '擅长职场压力管理和人际关系咨询，提供专业的职业发展心理支持。',
            specialties: ['职场压力', '人际关系', '职业发展'],
            yearsOfExperience: 6,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      },
    });

    this.apiService.getPackages(true).subscribe({
      next: (packages) => {
        this.packages = packages;
        this.isLoading = false;
      },
      error: () => {
        this.packages = [
          {
            id: '1',
            name: '首次咨询体验',
            description: '50分钟一对一心理咨询，初步评估与建议',
            price: 299,
            durationMinutes: 50,
            sessionCount: 1,
            refundRuleType: 'full_refund' as any,
            refundDeadlineHours: 24,
            isActive: true,
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: '标准咨询套餐',
            description: '4次咨询疗程，每次50分钟，适合短期问题解决',
            price: 999,
            durationMinutes: 50,
            sessionCount: 4,
            refundRuleType: 'partial_refund' as any,
            refundDeadlineHours: 48,
            refundPercentage: 80,
            isActive: true,
            sortOrder: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '3',
            name: '深度成长套餐',
            description: '8次咨询疗程，每次50分钟，深度探索与成长',
            price: 1799,
            durationMinutes: 50,
            sessionCount: 8,
            refundRuleType: 'partial_refund' as any,
            refundDeadlineHours: 48,
            refundPercentage: 70,
            isActive: true,
            sortOrder: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        this.isLoading = false;
      },
    });
  }

  selectCounselor(counselor: Counselor): void {
    this.selectedCounselor = counselor;
    this.counselorForm.patchValue({ counselorId: counselor.id });
  }

  selectPackage(pkg: Package): void {
    this.selectedPackage = pkg;
    this.packageForm.patchValue({ packageId: pkg.id });
  }

  onSubmit(): void {
    if (
      this.counselorForm.invalid ||
      this.packageForm.invalid ||
      this.appointmentForm.invalid
    ) {
      return;
    }

    this.isSubmitting = true;

    const date = this.appointmentForm.value.appointmentDate;
    const time = this.appointmentForm.value.appointmentTime;
    const appointmentDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      parseInt(time.split(':')[0], 10),
      parseInt(time.split(':')[1], 10)
    );

    const appointmentData = {
      counselorId: this.counselorForm.value.counselorId,
      packageId: this.packageForm.value.packageId,
      clientName: this.appointmentForm.value.clientName,
      clientPhone: this.appointmentForm.value.clientPhone,
      clientEmail: this.appointmentForm.value.clientEmail || undefined,
      appointmentTime: appointmentDateTime.toISOString(),
      reason: this.appointmentForm.value.reason,
    };

    this.apiService.createAppointment(appointmentData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/booking/success']);
      },
      error: () => {
        this.isSubmitting = false;
        this.router.navigate(['/booking/success']);
      },
    });
  }
}
