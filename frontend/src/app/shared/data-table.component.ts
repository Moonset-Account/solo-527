import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { BehaviorSubject } from 'rxjs';

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'template' | 'action';
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatCheckboxModule],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="data" matSort (matSortChange)="onSortChange($event)" class="data-table">
        <ng-container *ngIf="selectable" matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef>
            <mat-checkbox
              [checked]="selection.hasValue() && isAllSelected()"
              [indeterminate]="selection.hasValue() && !isAllSelected()"
              (change)="toggleAllRows($event)"
            ></mat-checkbox>
          </th>
          <td mat-cell *matCellDef="let row">
            <mat-checkbox (change)="toggleRow($event, row)" [checked]="selection.isSelected(row)"></mat-checkbox>
          </td>
        </ng-container>

        <ng-container *ngFor="let col of columns" [matColumnDef]="col.key">
          <th mat-header-cell *matHeaderCellDef [style.width]="col.width" [mat-sort-header]="col.sortable ? col.key : ''">
            {{ col.label }}
          </th>
          <td mat-cell *matCellDef="let row">
            <ng-container [ngSwitch]="col.type">
              <ng-container *ngSwitchCase="'template'">
                <ng-container *ngTemplateOutlet="cellTemplate?.[col.key] || defaultTemplate; context: { $implicit: row, column: col }"></ng-container>
              </ng-container>
              <ng-container *ngSwitchDefault>
                {{ row[col.key] }}
              </ng-container>
            </ng-container>
          </td>
        </ng-container>

        <ng-container *ngIf="actionTemplate" matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef style="width: 120px;">操作</th>
          <td mat-cell *matCellDef="let row">
            <ng-container *ngTemplateOutlet="actionTemplate; context: { $implicit: row }"></ng-container>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div *ngIf="showPagination" class="paginator-section">
        <mat-paginator
          [length]="total"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="pageSizeOptions"
          (page)="onPageChange($event)"
          showFirstLastButtons
        ></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .data-table {
      width: 100%;
    }
    .paginator-section {
      border-top: 1px solid #e0e0e0;
    }
    @media (max-width: 768px) {
      .table-container {
        overflow-x: auto;
      }
    }
  `]
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: ColumnDef[] = [];
  @Input() total: number = 0;
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() showPagination: boolean = true;
  @Input() sortable: boolean = false;
  @Input() selectable: boolean = false;
  @Input() cellTemplate?: Record<string, any>;
  @Input() actionTemplate?: any;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() selectionChange = new EventEmitter<any[]>();

  selection = new SelectionModel<any>(true, []);

  get displayedColumns(): string[] {
    const cols = this.columns.map(c => c.key);
    if (this.selectable) {
      cols.unshift('select');
    }
    if (this.actionTemplate) {
      cols.push('actions');
    }
    return cols;
  }

  get defaultTemplate(): any {
    return null;
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(event: any): void {
    if (event.checked) {
      this.data.forEach(row => this.selection.select(row));
    } else {
      this.selection.clear();
    }
    this.selectionChange.emit(this.selection.selected);
  }

  toggleRow(event: any, row: any): void {
    this.selection.toggle(row);
    this.selectionChange.emit(this.selection.selected);
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onSortChange(event: Sort): void {
    this.sortChange.emit(event);
  }
}
