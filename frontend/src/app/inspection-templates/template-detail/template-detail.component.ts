import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InspectionTemplatesService } from '../../services/inspection-templates.service';
import { InspectionTemplate, InspectionTemplateItem } from '../../models/inspection-template.model';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './template-detail.component.html',
  styleUrls: ['./template-detail.component.scss'],
})
export class TemplateDetailComponent implements OnInit {
  template: InspectionTemplate | null = null;
  form!: FormGroup;
  loading = true;
  editMode = false;
  isNew = false;

  frequencyOptions = [
    { value: 'DAILY', label: '每日' },
    { value: 'WEEKLY', label: '每周' },
    { value: 'MONTHLY', label: '每月' },
    { value: 'QUARTERLY', label: '每季度' },
  ];

  categoryOptions = [
    { value: 'SYSTEM', label: '系统检查' },
    { value: 'SECURITY', label: '安全检查' },
    { value: 'PERFORMANCE', label: '性能检查' },
    { value: 'NETWORK', label: '网络检查' },
  ];

  private id = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private templatesService: InspectionTemplatesService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.isNew = this.id === 'new';
    this.editMode = this.isNew;

    if (this.isNew) {
      this.buildForm({ name: '', description: '', frequency: 'DAILY', isActive: true, items: [], createdBy: '', createdAt: '', updatedAt: '', id: '' });
      this.loading = false;
    } else {
      this.loadTemplate();
    }
  }

  loadTemplate(): void {
    this.loading = true;
    this.templatesService.getById(this.id).subscribe({
      next: (data) => {
        this.template = data;
        this.buildForm(data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('加载模板详情失败', '关闭', { duration: 3000 });
      },
    });
  }

  buildForm(template: InspectionTemplate): void {
    const itemsArray = this.fb.array(
      (template.items || []).map((item) => this.createItemGroup(item))
    );

    this.form = this.fb.group({
      name: [template.name, Validators.required],
      description: [template.description],
      frequency: [template.frequency, Validators.required],
      isActive: [template.isActive],
      items: itemsArray,
    });
  }

  createItemGroup(item?: InspectionTemplateItem): FormGroup {
    return this.fb.group({
      name: [item?.name || '', Validators.required],
      description: [item?.description || ''],
      category: [item?.category || 'SYSTEM'],
      expectedValue: [item?.expectedValue || ''],
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  toggleEditMode(): void {
    if (this.editMode && this.template) {
      this.buildForm(this.template);
    }
    this.editMode = !this.editMode;
  }

  save(): void {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isNew) {
      this.templatesService.create(data).subscribe({
        next: () => {
          this.snackBar.open('模板创建成功', '关闭', { duration: 3000 });
          this.router.navigate(['/inspection-templates']);
        },
        error: () => {
          this.snackBar.open('创建失败', '关闭', { duration: 3000 });
        },
      });
    } else {
      this.templatesService.update(this.id, data).subscribe({
        next: (updated) => {
          this.template = updated;
          this.editMode = false;
          this.snackBar.open('保存成功', '关闭', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('保存失败', '关闭', { duration: 3000 });
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/inspection-templates']);
  }
}
