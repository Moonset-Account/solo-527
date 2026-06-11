import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Budget, BudgetItem, BudgetItemCategory, MaterialItem } from '@shared/models';
import { BudgetService } from '@shared/services/budget.service';
import { CategoryLabelPipe } from '@shared/pipes/category-label.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';

@Component({
  selector: 'app-budget-edit',
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
    StatusLabelPipe,
  ],
  templateUrl: './budget-edit.component.html',
  styleUrls: ['./budget-edit.component.scss'],
})
export class BudgetEditComponent implements OnInit {
  budget!: Budget;
  budgetForm: FormGroup;
  loading = true;

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
    private budgetService: BudgetService,
    private snackBar: MatSnackBar
  ) {
    this.budgetForm = this.fb.group({
      changeReason: ['', Validators.required],
      laborCost: [0],
      sections: this.fb.array([]),
    });
  }

  get sections(): FormArray {
    return this.budgetForm.get('sections') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBudget(id);
    }
  }

  loadBudget(id: string): void {
    this.budgetService.getById(id).subscribe({
      next: (data) => {
        this.budget = data;
        this.populateForm(data);
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('加载预算失败', '关闭', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  populateForm(budget: Budget): void {
    this.budgetForm.patchValue({
      changeReason: budget.changeReason || '',
      laborCost: budget.laborCost,
    });

    const grouped = new Map<BudgetItemCategory, BudgetItem[]>();
    for (const item of budget.items) {
      if (!grouped.has(item.category)) grouped.set(item.category, []);
      grouped.get(item.category)!.push(item);
    }

    for (const [, items] of grouped) {
      const sectionGroup = this.fb.group({
        category: [items[0].category, Validators.required],
        items: this.fb.array(items.map((i) => this.createItemGroup(i))),
      });
      this.sections.push(sectionGroup);
    }
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

  getSectionItems(si: number): FormArray {
    return this.sections.at(si).get('items') as FormArray;
  }

  getItemMaterials(si: number, ii: number): FormArray {
    return this.getSectionItems(si).at(ii).get('materials') as FormArray;
  }

  addItem(si: number): void {
    this.getSectionItems(si).push(this.createItemGroup());
  }

  removeItem(si: number, ii: number): void {
    this.getSectionItems(si).removeAt(ii);
  }

  addMaterial(si: number, ii: number): void {
    this.getItemMaterials(si, ii).push(this.createMaterialGroup());
  }

  removeMaterial(si: number, ii: number, mi: number): void {
    this.getItemMaterials(si, ii).removeAt(mi);
  }

  removeSection(index: number): void {
    this.sections.removeAt(index);
  }

  addSection(): void {
    this.sections.push(
      this.fb.group({
        category: ['', Validators.required],
        items: this.fb.array([this.createItemGroup()]),
      })
    );
  }

  onItemValueChange(si: number, ii: number): void {
    const item = this.getSectionItems(si).at(ii);
    const qty = item.get('quantity')?.value || 0;
    const price = item.get('unitPrice')?.value || 0;
    item.get('totalPrice')?.setValue(qty * price);
  }

  onMaterialValueChange(si: number, ii: number, mi: number): void {
    const mat = this.getItemMaterials(si, ii).at(mi);
    const qty = mat.get('quantity')?.value || 0;
    const price = mat.get('unitPrice')?.value || 0;
    mat.get('totalPrice')?.setValue(qty * price);
  }

  getSectionSubtotal(si: number): number {
    let total = 0;
    const items = this.getSectionItems(si);
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
      this.snackBar.open('请完善表单', '关闭', { duration: 3000 });
      return;
    }
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

    this.budgetService.update(this.budget.id, payload).subscribe({
      next: () => {
        this.snackBar.open('预算更新成功', '关闭', { duration: 2000 });
        this.router.navigate(['/admin/projects', this.budget.projectId]);
      },
      error: () => this.snackBar.open('更新失败', '关闭', { duration: 3000 }),
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/projects', this.budget.projectId]);
  }
}
