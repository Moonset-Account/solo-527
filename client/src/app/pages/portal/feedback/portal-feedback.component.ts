import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeedbackStage } from '@shared/models';
import { FeedbackService } from '@shared/services/feedback.service';

@Component({
  selector: 'app-portal-feedback',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
  ],
  templateUrl: './portal-feedback.component.html',
  styleUrls: ['./portal-feedback.component.scss'],
})
export class PortalFeedbackComponent {
  feedbackForm: FormGroup;
  rating = 0;
  hoverRating = 0;
  submitting = false;
  token = '';

  stageOptions: { value: FeedbackStage; label: string }[] = [
    { value: 'design', label: '设计阶段' },
    { value: 'construction', label: '施工阶段' },
    { value: 'completion', label: '竣工阶段' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private feedbackService: FeedbackService,
    private snackBar: MatSnackBar
  ) {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.feedbackForm = this.fb.group({
      stage: ['', Validators.required],
      comment: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  setRating(value: number): void {
    this.rating = value;
  }

  getStarIcon(index: number): string {
    if (index < this.hoverRating) return 'star';
    if (index < this.rating) return 'star';
    return 'star_border';
  }

  getStarClass(index: number): string {
    if (index < this.hoverRating) return 'hovered';
    if (index < this.rating) return 'selected';
    return '';
  }

  onSubmit(): void {
    if (this.feedbackForm.invalid || this.rating === 0) {
      this.snackBar.open('请填写完整信息并选择评分', '关闭', { duration: 3000 });
      return;
    }

    this.submitting = true;
    const projectId = this.route.snapshot.paramMap.get('id') || '';
    const payload = {
      ...this.feedbackForm.value,
      rating: this.rating,
      projectId,
    };

    this.feedbackService.create(projectId, payload).subscribe({
      next: () => {
        this.snackBar.open('感谢您的反馈！', '关闭', { duration: 3000 });
        this.feedbackForm.reset();
        this.rating = 0;
        this.submitting = false;
      },
      error: () => {
        this.snackBar.open('提交失败，请稍后重试', '关闭', { duration: 3000 });
        this.submitting = false;
      },
    });
  }
}
