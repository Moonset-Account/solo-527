import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Project, ProjectStatus } from '@shared/models';
import { ProjectService } from '@shared/services/project.service';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    ReactiveFormsModule,
    StatusLabelPipe,
    CurrencyPipe,
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  displayedColumns: string[] = ['name', 'customerName', 'area', 'totalBudget', 'status', 'actions'];
  filterForm: FormGroup;
  isMobile = false;

  statusOptions: { value: ProjectStatus | ''; label: string }[] = [
    { value: '', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'budgeting', label: '预算中' },
    { value: 'confirmed', label: '已确认' },
    { value: 'contracted', label: '已签约' },
    { value: 'constructing', label: '施工中' },
    { value: 'completed', label: '已完成' },
  ];

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      search: [''],
    });
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });
  }

  ngOnInit(): void {
    this.loadProjects();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  loadProjects(): void {
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
        this.filteredProjects = [...data];
      },
      error: () => {},
    });
  }

  applyFilters(): void {
    const { status, search } = this.filterForm.value;
    let result = [...this.projects];
    if (status) {
      result = result.filter((p) => p.status === status);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.customerName.toLowerCase().includes(term) ||
          p.address.toLowerCase().includes(term)
      );
    }
    this.filteredProjects = result;
  }

  getStatusClass(status: string): string {
    return status;
  }

  addProject(): void {
    this.router.navigate(['/admin/projects/new']);
  }

  viewProject(id: string): void {
    this.router.navigate(['/admin/projects', id]);
  }

  editProject(id: string): void {
    this.router.navigate(['/admin/projects', id, 'edit']);
  }

  deleteProject(id: string): void {
    if (confirm('确定要删除此项目吗？')) {
      this.projectService.delete(id).subscribe({
        next: () => this.loadProjects(),
        error: () => {},
      });
    }
  }
}
