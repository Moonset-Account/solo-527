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
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AfterSaleOrder, AfterSaleStatus } from '@shared/models';
import { AfterSaleService } from '@shared/services/after-sale.service';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-after-sale-list',
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
    MatChipsModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    StatusLabelPipe,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './after-sale-list.component.html',
  styleUrls: ['./after-sale-list.component.scss'],
})
export class AfterSaleListComponent implements OnInit {
  orders: AfterSaleOrder[] = [];
  filteredOrders: AfterSaleOrder[] = [];
  viewMode: 'kanban' | 'list' = 'kanban';
  filterForm: FormGroup;
  displayedColumns: string[] = ['title', 'project', 'assignee', 'status', 'date', 'actions'];

  pendingOrders: AfterSaleOrder[] = [];
  processingOrders: AfterSaleOrder[] = [];
  closedOrders: AfterSaleOrder[] = [];

  constructor(
    private fb: FormBuilder,
    private afterSaleService: AfterSaleService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      search: [''],
    });
  }

  ngOnInit(): void {
    this.loadOrders();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  loadOrders(): void {
    this.afterSaleService.getAll().subscribe({
      next: (data) => {
        this.orders = data;
        this.applyFilters();
      },
      error: () => {},
    });
  }

  applyFilters(): void {
    const { status, search } = this.filterForm.value;
    let result = [...this.orders];
    if (status) {
      result = result.filter((o) => o.status === status);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(term) ||
          o.description.toLowerCase().includes(term)
      );
    }
    this.filteredOrders = result;
    this.pendingOrders = result.filter((o) => o.status === 'pending');
    this.processingOrders = result.filter((o) => o.status === 'processing');
    this.closedOrders = result.filter((o) => o.status === 'closed');
  }

  drop(event: CdkDragDrop<AfterSaleOrder[]>, targetStatus: AfterSaleStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const order = event.previousContainer.data[event.previousIndex];
      this.afterSaleService.update(order.id, { status: targetStatus }).subscribe({
        next: () => {
          this.loadOrders();
          this.snackBar.open('状态已更新', '关闭', { duration: 2000 });
        },
        error: () => this.snackBar.open('更新失败', '关闭', { duration: 3000 }),
      });
    }
  }

  closeOrder(id: string): void {
    this.afterSaleService.close(id).subscribe({
      next: () => {
        this.loadOrders();
        this.snackBar.open('工单已关闭', '关闭', { duration: 2000 });
      },
      error: () => this.snackBar.open('关闭失败', '关闭', { duration: 3000 }),
    });
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'kanban' ? 'list' : 'kanban';
  }
}
