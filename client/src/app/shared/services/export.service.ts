import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private api: ApiService) {}

  exportFeedbacks(filters?: Record<string, any>): void {
    this.api.download('/export/feedbacks', filters).subscribe((blob) => {
      this.downloadBlob(blob, 'feedbacks.xlsx');
    });
  }

  exportAfterSaleReport(filters?: Record<string, any>): void {
    this.api.download('/export/after-sale-report', filters).subscribe((blob) => {
      this.downloadBlob(blob, 'after-sale-report.xlsx');
    });
  }

  exportBudget(budgetId: string): void {
    this.api.download(`/export/budget/${budgetId}`).subscribe((blob) => {
      this.downloadBlob(blob, 'budget.xlsx');
    });
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
