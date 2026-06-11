import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Feedback, FeedbackStage } from '@shared/models';
import { FeedbackService } from '@shared/services/feedback.service';
import { ExportService } from '@shared/services/export.service';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';

@Component({
  selector: 'app-feedback-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    StatusLabelPipe,
  ],
  templateUrl: './feedback-list.component.html',
  styleUrls: ['./feedback-list.component.scss'],
})
export class FeedbackListComponent implements OnInit {
  feedbacks: Feedback[] = [];
  displayedColumns: string[] = ['project', 'customer', 'stage', 'rating', 'comment', 'date'];
  filterForm: FormGroup;

  stageOptions: { value: FeedbackStage | ''; label: string }[] = [
    { value: '', label: '全部阶段' },
    { value: 'design', label: '设计阶段' },
    { value: 'construction', label: '施工阶段' },
    { value: 'completion', label: '竣工阶段' },
  ];

  ratingOptions = [
    { value: 0, label: '全部评分' },
    { value: 5, label: '5星' },
    { value: 4, label: '4星及以上' },
    { value: 3, label: '3星及以上' },
    { value: 2, label: '2星及以上' },
    { value: 1, label: '1星' },
  ];

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private exportService: ExportService
  ) {
    this.filterForm = this.fb.group({
      projectId: [''],
      stage: [''],
      startDate: [''],
      endDate: [''],
      minRating: [0],
    });
  }

  ngOnInit(): void {
    this.loadFeedbacks();
    this.filterForm.valueChanges.subscribe(() => this.loadFeedbacks());
  }

  loadFeedbacks(): void {
    const filters: Record<string, any> = {};
    const formVal = this.filterForm.value;
    if (formVal.projectId) filters['projectId'] = formVal.projectId;
    if (formVal.stage) filters['stage'] = formVal.stage;
    if (formVal.startDate) filters['startDate'] = formVal.startDate.toISOString();
    if (formVal.endDate) filters['endDate'] = formVal.endDate.toISOString();
    if (formVal.minRating > 0) filters['minRating'] = formVal.minRating;

    this.feedbackService.getAll(filters).subscribe({
      next: (data) => (this.feedbacks = data),
      error: () => {},
    });
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
      design: '设计阶段',
      construction: '施工阶段',
      completion: '竣工阶段',
    };
    return labels[stage] || stage;
  }

  exportExcel(): void {
    const filters: Record<string, any> = {};
    const formVal = this.filterForm.value;
    if (formVal.stage) filters['stage'] = formVal.stage;
    if (formVal.startDate) filters['startDate'] = formVal.startDate.toISOString();
    if (formVal.endDate) filters['endDate'] = formVal.endDate.toISOString();
    this.exportService.exportFeedbacks(filters);
  }
}
