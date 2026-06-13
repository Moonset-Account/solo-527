import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ProjectDetail, ProjectPhoto, Attachment, BudgetItem, BudgetItemCategory } from '@shared/models';
import { ProjectService } from '@shared/services/project.service';
import { ApiService } from '@shared/services/api.service';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';
import { CategoryLabelPipe } from '@shared/pipes/category-label.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatListModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    StatusLabelPipe,
    CategoryLabelPipe,
    CurrencyPipe,
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  project!: ProjectDetail;
  loading = true;
  isMobile = false;
  selectedTabIndex = 0;
  photoSearchTerm = '';
  materialSearchTerm = '';
  photoArea = '';
  dragOver = false;
  attachmentDragOver = false;
  quickEditForm: FormGroup;
  editingItemId: string | null = null;

  photoAreas = ['客厅', '卧室', '厨房', '卫生间', '阳台', '玄关', '其他'];

  @ViewChild('fileInputPhoto') fileInputPhoto!: ElementRef;
  @ViewChild('fileInputAttachment') fileInputAttachment!: ElementRef;

  private destroy$ = new Subject<void>();

  categoryOrder: BudgetItemCategory[] = [
    'demolition', 'plumbing', 'masonry', 'carpentry', 'painting', 'main_material', 'other'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.checkScreenSize();
    this.quickEditForm = this.fb.group({
      quantity: [''],
      unitPrice: [''],
      description: [''],
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProject(id: string): void {
    this.loading = true;
    this.projectService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.project = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('加载项目失败', '关闭', { duration: 3000 });
      },
    });
  }

  getGroupedItems(): { category: BudgetItemCategory; items: BudgetItem[] }[] {
    if (!this.project?.latestBudget?.items) return [];
    const groups = new Map<BudgetItemCategory, BudgetItem[]>();
    for (const item of this.project.latestBudget.items) {
      if (!groups.has(item.category)) {
        groups.set(item.category, []);
      }
      groups.get(item.category)!.push(item);
    }
    return this.categoryOrder
      .filter((cat) => groups.has(cat))
      .map((cat) => ({ category: cat, items: groups.get(cat)! }));
  }

  getFilteredGroups(): { category: BudgetItemCategory; items: BudgetItem[] }[] {
    const groups = this.getGroupedItems();
    if (!this.materialSearchTerm) return groups;
    const term = this.materialSearchTerm.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.name.toLowerCase().includes(term) ||
            i.description.toLowerCase().includes(term)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }

  getPhotosByArea(): { area: string; photos: ProjectPhoto[] }[] {
    if (!this.project?.photos) return [];
    const groups = new Map<string, ProjectPhoto[]>();
    for (const photo of this.project.photos) {
      const area = photo.area || '未分类';
      if (!groups.has(area)) {
        groups.set(area, []);
      }
      groups.get(area)!.push(photo);
    }
    return Array.from(groups.entries()).map(([area, photos]) => ({ area, photos }));
  }

  getFilteredPhotosByArea(): { area: string; photos: ProjectPhoto[] }[] {
    const groups = this.getPhotosByArea();
    if (!this.photoSearchTerm) return groups;
    const term = this.photoSearchTerm.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        photos: g.photos.filter((p) => p.area?.toLowerCase().includes(term)),
      }))
      .filter((g) => g.photos.length > 0);
  }

  getCategorySubtotal(items: BudgetItem[]): number {
    return items.reduce((sum, i) => sum + i.totalPrice, 0);
  }

  startQuickEdit(item: BudgetItem): void {
    this.editingItemId = item.id;
    this.quickEditForm.patchValue({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      description: item.description,
    });
  }

  cancelQuickEdit(): void {
    this.editingItemId = null;
    this.quickEditForm.reset();
  }

  saveQuickEdit(item: BudgetItem): void {
    const values = this.quickEditForm.value;
    const updatedItem = {
      ...item,
      quantity: parseFloat(values.quantity) || item.quantity,
      unitPrice: parseFloat(values.unitPrice) || item.unitPrice,
      description: values.description || item.description,
      totalPrice: (parseFloat(values.quantity) || item.quantity) * (parseFloat(values.unitPrice) || item.unitPrice),
    };

    this.api.patch(`/budget-items/${item.id}`, updatedItem).subscribe({
      next: () => {
        this.snackBar.open('更新成功', '关闭', { duration: 2000 });
        this.loadProject(this.project.id);
        this.cancelQuickEdit();
      },
      error: () => {
        this.snackBar.open('更新失败', '关闭', { duration: 3000 });
      },
    });
  }

  editBudget(): void {
    if (this.project.latestBudget) {
      this.router.navigate(['/admin/budgets', this.project.latestBudget.id, 'edit']);
    }
  }

  createBudget(): void {
    this.router.navigate(['/admin/projects', this.project.id, 'budget', 'new']);
  }

  viewBudgetVersions(): void {
    this.router.navigate(['/admin/projects', this.project.id, 'budget-versions']);
  }

  viewContract(): void {
    if (this.project.contract) {
      this.router.navigate(['/admin/contracts', this.project.contract.id]);
    }
  }

  openPhoto(url: string): void {
    window.open(url, '_blank');
  }

  onPhotoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadPhotos(Array.from(input.files));
      input.value = '';
    }
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadPhotos(Array.from(event.dataTransfer.files));
    }
  }

  onPhotoDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onPhotoDragLeave(): void {
    this.dragOver = false;
  }

  private async uploadPhotos(files: File[]): Promise<void> {
    const area = this.photoArea || '未分类';
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('area', area);

      try {
        await this.api.upload(`/projects/${this.project.id}/photos`, formData).toPromise();
      } catch (e) {
        this.snackBar.open(`照片 ${file.name} 上传失败`, '关闭', { duration: 3000 });
      }
    }
    this.snackBar.open('照片上传成功', '关闭', { duration: 2000 });
    this.loadProject(this.project.id);
  }

  onAttachmentUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadAttachments(Array.from(input.files));
      input.value = '';
    }
  }

  onAttachmentDrop(event: DragEvent): void {
    event.preventDefault();
    this.attachmentDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadAttachments(Array.from(event.dataTransfer.files));
    }
  }

  onAttachmentDragOver(event: DragEvent): void {
    event.preventDefault();
    this.attachmentDragOver = true;
  }

  onAttachmentDragLeave(): void {
    this.attachmentDragOver = false;
  }

  private async uploadAttachments(files: File[]): Promise<void> {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'project');
      formData.append('entityId', this.project.id);

      try {
        await this.api.upload('/files/upload', formData).toPromise();
      } catch (e) {
        this.snackBar.open(`附件 ${file.name} 上传失败`, '关闭', { duration: 3000 });
      }
    }
    this.snackBar.open('附件上传成功', '关闭', { duration: 2000 });
    this.loadProject(this.project.id);
  }

  deletePhoto(photoId: string): void {
    if (confirm('确定要删除此照片吗？')) {
      this.api.delete(`/files/${photoId}`).subscribe({
        next: () => this.loadProject(this.project.id),
        error: () => this.snackBar.open('删除失败', '关闭', { duration: 3000 }),
      });
    }
  }

  deleteAttachment(attachmentId: string): void {
    if (confirm('确定要删除此附件吗？')) {
      this.api.delete(`/files/${attachmentId}`).subscribe({
        next: () => this.loadProject(this.project.id),
        error: () => this.snackBar.open('删除失败', '关闭', { duration: 3000 }),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/projects']);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  triggerPhotoUpload(): void {
    this.fileInputPhoto.nativeElement.click();
  }

  triggerAttachmentUpload(): void {
    this.fileInputAttachment.nativeElement.click();
  }
}
