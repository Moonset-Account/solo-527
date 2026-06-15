import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InspectionTemplatesService } from '../services/inspection-templates.service';
import { InspectionTemplate } from '../models/inspection-template.model';

@Component({
  selector: 'app-inspection-templates',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
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

  navigateToCreate(): void {
    this.router.navigate(['/inspection-templates', 'new']);
  }
}
