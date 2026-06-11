import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ProjectDetail, BudgetItem, BudgetItemCategory, MaterialItem } from '@shared/models';
import { ProjectService } from '@shared/services/project.service';
import { BudgetService } from '@shared/services/budget.service';
import { CategoryLabelPipe } from '@shared/pipes/category-label.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';

@Component({
  selector: 'app-budget-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatExpansionModule,
    MatSnackBarModule,
    CategoryLabelPipe,
    CurrencyPipe,
  ],
  templateUrl: './budget-create.component.html',
  styleUrls: ['./budget-create.component.scss'],
})
export class BudgetCreateComponent implements OnInit {
  project!: ProjectDetail;
  budgetForm: FormGroup;
  loading = false;
  isMobile = false;

  categoryOptions: { value: BudgetItemCategory; label: string }[] = [
    { value: 'demolition', label: '拆除工程' },
    { value: 'plumbing', label: '水电工程' },
    { value: 'masonry', label: '泥瓦工程' },
    { value: 'carpentry', label: '木工工程' },
    { value: 'painting', label: '油漆工程' },
    { value: 'main_material', label: '主材' },
    { value: 'other', label: '其他' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private budgetService: BudgetService,
    private snackBar: MatSnackBar
  ) {
    this.budgetForm = this.fb.group({
      changeReason: [''],
      laborCost: [0],
      sections: this.fb.array([]),
    });
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });
  }

  get sections(): FormArray {
    return this.budgetForm.get('sections') as FormArray;
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectService.getById(projectId).subscribe({
        next: (data) => {
          this.project = data;
          if (data.latestBudget) {
            this.populateForm(data.latestBudget.items);
          }
        },
        error: () => this.snackBar.open('加载项目失败', '关闭', { duration: 3000 }),
      });
    }
  }

  populateForm(items: BudgetItem[]): void {
    const grouped = new Map<BudgetItemCategory, BudgetItem[]>();
    for (const item of items) {
      if (!grouped.has(item.category)) grouped.set(item.category, []);
      grouped.get(item.category)!.push(item);
    }
    for (const [category, categoryItems] of grouped) {
      this.addSection(category, categoryItems);
    }
  }

  addSection(category?: BudgetItemCategory, existingItems?: BudgetItem[]): void {
    const sectionGroup = this.fb.group({
      category: [category || '', Validators.required],
      items: this.fb.array(
        existingItems ? existingItems.map((i) => this.createItemGroup(i)) : [this.createItemGroup()]
      ),
    });
    this.sections.push(sectionGroup);
  }

  createItemGroup(item?: BudgetItem): FormGroup {
    return this.fb.group({
      id: [item?.id || ''],
      name: [item?.name || '', Validators.required],
      description: [item?.description || ''],
      quantity: [item?.quantity || 0, [Validators.required, Validators.min(0)]],
      unit: [item?.unit || '', Validators.required],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      totalPrice: [{ value: item?.totalPrice || 0, disabled: true }],
      materials: this.fb.array(
        item?.materials ? item.materials.map((m) => this.createMaterialGroup(m)) : []
      ),
    });
  }

  createMaterialGroup(material?: MaterialItem): FormGroup {
    return this.fb.group({
      id: [material?.id || ''],
      name: [material?.name || '', Validators.required],
      specification: [material?.specification || ''],
      quantity: [material?.quantity || 0, [Validators.required, Validators.min(0)]],
      unit: [material?.unit || '', Validators.required],
      unitPrice: [material?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      totalPrice: [{ value: material?.totalPrice || 0, disabled: true }],
    });
  }

  getSectionItems(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('items') as FormArray;
  }

  getItemMaterials(sectionIndex: number, itemIndex: number): FormArray {
    return this.getSectionItems(sectionIndex).at(itemIndex).get('materials') as FormArray;
  }

  addItem(sectionIndex: number): void {
    this.getSectionItems(sectionIndex).push(this.createItemGroup());
  }

  removeItem(sectionIndex: number, itemIndex: number): void {
    this.getSectionItems(sectionIndex).removeAt(itemIndex);
  }

  addMaterial(sectionIndex: number, itemIndex: number): void {
    this.getItemMaterials(sectionIndex, itemIndex).push(this.createMaterialGroup());
  }

  removeMaterial(sectionIndex: number, itemIndex: number, matIndex: number): void {
    this.getItemMaterials(sectionIndex, itemIndex).removeAt(matIndex);
  }

  removeSection(index: number): void {
    this.sections.removeAt(index);
  }

  onItemValueChange(sectionIndex: number, itemIndex: number): void {
    const itemGroup = this.getSectionItems(sectionIndex).at(itemIndex);
    const qty = itemGroup.get('quantity')?.value || 0;
    const price = itemGroup.get('unitPrice')?.value || 0;
    itemGroup.get('totalPrice')?.setValue(qty * price);
  }

  onMaterialValueChange(sectionIndex: number, itemIndex: number, matIndex: number): void {
    const matGroup = this.getItemMaterials(sectionIndex, itemIndex).at(matIndex);
    const qty = matGroup.get('quantity')?.value || 0;
    const price = matGroup.get('unitPrice')?.value || 0;
    matGroup.get('totalPrice')?.setValue(qty * price);
  }

  getSectionSubtotal(sectionIndex: number): number {
    const items = this.getSectionItems(sectionIndex);
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      const qty = items.at(i).get('quantity')?.value || 0;
      const price = items.at(i).get('unitPrice')?.value || 0;
      total += qty * price;
    }
    return total;
  }

  get totalMaterialCost(): number {
    let total = 0;
    for (let s = 0; s < this.sections.length; s++) {
      total += this.getSectionSubtotal(s);
    }
    return total;
  }

  get laborCost(): number {
    return this.budgetForm.get('laborCost')?.value || 0;
  }

  get totalCost(): number {
    return this.laborCost + this.totalMaterialCost;
  }

  saveDraft(): void {
    this.saveBudget('draft');
  }

  submitForReview(): void {
    this.saveBudget('pending_review');
  }

  private saveBudget(status: string): void {
    if (this.budgetForm.invalid) {
      this.snackBar.open('请完善表单信息', '关闭', { duration: 3000 });
      return;
    }
    this.loading = true;
    const formValue = this.budgetForm.getRawValue();
    const payload = {
      changeReason: formValue.changeReason,
      laborCost: formValue.laborCost,
      materialCost: this.totalMaterialCost,
      totalCost: this.totalCost,
      status,
      items: formValue.sections.flatMap((section: any) =>
        section.items.map((item: any) => ({
          ...item,
          category: section.category,
          totalPrice: (item.quantity || 0) * (item.unitPrice || 0),
          materials: (item.materials || []).map((m: any) => ({
            ...m,
            totalPrice: (m.quantity || 0) * (m.unitPrice || 0),
          })),
        }))
      ),
    };

    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.budgetService.create(projectId, payload).subscribe({
        next: () => {
          this.snackBar.open('预算保存成功', '关闭', { duration: 2000 });
          this.router.navigate(['/admin/projects', projectId]);
        },
        error: () => {
          this.snackBar.open('保存失败', '关闭', { duration: 3000 });
          this.loading = false;
        },
      });
    }
  }

  goBack(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.router.navigate(['/admin/projects', projectId]);
    } else {
      this.router.navigate(['/admin/projects']);
    }
  }
}
