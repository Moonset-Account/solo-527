import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Property } from '../../types';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      {{ isEdit ? '编辑房源' : '新增房源' }}
      <button mat-icon-button class="close-btn" (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </h2>
    <mat-dialog-content class="dialog-content">
      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>房源编号</mat-label>
          <input matInput [(ngModel)]="form.code" placeholder="请输入房源编号">
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>房源名称</mat-label>
          <input matInput [(ngModel)]="form.name" placeholder="请输入房源名称">
        </mat-form-field>
      </div>
      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>类型</mat-label>
          <mat-select [(ngModel)]="form.type">
            <mat-option value="office">办公室</mat-option>
            <mat-option value="studio">工作室</mat-option>
            <mat-option value="shop">商铺</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>楼栋</mat-label>
          <mat-select [(ngModel)]="form.building">
            <mat-option value="A栋">A栋</mat-option>
            <mat-option value="B栋">B栋</mat-option>
            <mat-option value="C栋">C栋</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>楼层</mat-label>
          <input matInput type="number" [(ngModel)]="form.floor" placeholder="请输入楼层">
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>面积(㎡)</mat-label>
          <input matInput type="number" [(ngModel)]="form.area" placeholder="请输入面积">
        </mat-form-field>
      </div>
      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>月租金(元)</mat-label>
          <input matInput type="number" [(ngModel)]="form.price" placeholder="请输入月租金">
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>状态</mat-label>
          <mat-select [(ngModel)]="form.status">
            <mat-option value="vacant">空置</mat-option>
            <mat-option value="rented">已租</mat-option>
            <mat-option value="maintenance">维修中</mat-option>
            <mat-option value="closed">已关闭</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="form-field full-width">
        <mat-label>描述</mat-label>
        <textarea matInput [(ngModel)]="form.description" rows="3" placeholder="请输入描述"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="dialogRef.close()">取消</button>
      <button mat-raised-button color="primary" (click)="onSave()">保存</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title { display: flex; justify-content: space-between; align-items: center; margin: 0; padding: 16px 24px; }
    .close-btn { margin-right: -8px; }
    .dialog-content { padding: 0 24px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 8px; }
    .form-field { flex: 1; }
    .full-width { width: 100%; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; }
  `]
})
export class PropertyFormComponent {
  isEdit: boolean;
  form: any = {
    code: '',
    name: '',
    type: 'office',
    building: 'A栋',
    floor: 1,
    area: 0,
    price: 0,
    status: 'vacant',
    description: ''
  };

  constructor(
    public dialogRef: MatDialogRef<PropertyFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { property?: Property }
  ) {
    this.isEdit = !!data.property;
    if (data.property) {
      this.form = { ...data.property };
    }
  }

  onSave(): void {
    this.dialogRef.close(this.form);
  }
}
