import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { ChargeService, Charge, ChargeItem } from '../../../core/services/charge.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-charge-detail',
  templateUrl: './charge-detail.component.html',
  styleUrls: ['./charge-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChargeDetailComponent implements OnInit, OnDestroy {
  chargeForm: FormGroup;
  isEdit = false;
  isView = false;
  chargeId?: number;
  charge?: Charge;
  private destroy$ = new Subject<void>();

  paymentMethods = [
    { value: 'cash', label: '现金' },
    { value: 'wechat', label: '微信' },
    { value: 'alipay', label: '支付宝' },
    { value: 'card', label: '银行卡' },
    { value: 'insurance', label: '医保' },
    { value: 'other', label: '其他' }
  ];

  statusOptions = [
    { value: 'pending', label: '待支付' },
    { value: 'paid', label: '已支付' },
    { value: 'refunded', label: '已退款' },
    { value: 'cancelled', label: '已取消' }
  ];

  itemTypes = [
    { value: 'examination', label: '检查费' },
    { value: 'treatment', label: '治疗费' },
    { value: 'medicine', label: '药品费' },
    { value: 'material', label: '材料费' },
    { value: 'surgery', label: '手术费' },
    { value: 'other', label: '其他' }
  ];

  constructor(
    private fb: FormBuilder,
    private chargeService: ChargeService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.chargeForm = this.fb.group({
      patientId: ['', [Validators.required]],
      patientName: ['', [Validators.required]],
      prescriptionId: [''],
      paymentMethod: ['', [Validators.required]],
      status: ['pending'],
      remarks: [''],
      items: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.chargeForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.addItem();

    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          if (params['id']) {
            this.chargeId = +params['id'];
            if (this.route.snapshot.url[0]?.path === 'view') {
              this.isView = true;
              this.chargeForm.disable();
            } else {
              this.isEdit = true;
            }
            return this.chargeService.getCharge(this.chargeId);
          }
          return of(null);
        })
      )
      .subscribe(charge => {
        if (charge) {
          this.charge = charge;
          this.patchFormWithCharge(charge);
        }
      });

    this.items.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateTotals();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private patchFormWithCharge(charge: Charge): void {
    this.chargeForm.patchValue({
      patientId: charge.patientId,
      patientName: charge.patientName,
      prescriptionId: charge.prescriptionId,
      paymentMethod: charge.paymentMethod,
      status: charge.status,
      remarks: charge.remarks
    });

    while (this.items.length > 0) {
      this.items.removeAt(0);
    }

    charge.items.forEach(item => {
      this.items.push(this.createItem(item));
    });
  }

  private createItem(item?: ChargeItem): FormGroup {
    return this.fb.group({
      id: [item?.id],
      itemName: [item?.itemName || '', [Validators.required]],
      itemType: [item?.itemType || '', [Validators.required]],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      discount: [item?.discount || 0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: item?.totalPrice || 0, disabled: true }],
      actualPrice: [{ value: item?.actualPrice || 0, disabled: true }]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.calculateTotals();
  }

  calculateTotals(): void {
    const itemsValue = this.items.value;
    itemsValue.forEach((item: any, index: number) => {
      const totalPrice = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const actualPrice = totalPrice * (1 - discount / 100);

      this.items.at(index).patchValue({
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        actualPrice: parseFloat(actualPrice.toFixed(2))
      }, { emitEvent: false });
    });
  }

  get totalAmount(): number {
    return this.items.value.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
  }

  get actualAmount(): number {
    return this.items.value.reduce((sum: number, item: any) => sum + (item.actualPrice || 0), 0);
  }

  get discountAmount(): number {
    return this.totalAmount - this.actualAmount;
  }

  onSubmit(): void {
    if (this.chargeForm.invalid) {
      return;
    }

    const formValue = this.chargeForm.getRawValue();

    const requestData = {
      patientId: formValue.patientId,
      patientName: formValue.patientName,
      prescriptionId: formValue.prescriptionId,
      paymentMethod: formValue.paymentMethod,
      remarks: formValue.remarks,
      items: formValue.items.map((item: any) => ({
        itemName: item.itemName,
        itemType: item.itemType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount
      }))
    };

    const request$ = this.isEdit
      ? this.chargeService.updateCharge(this.chargeId!, {
          paymentMethod: formValue.paymentMethod,
          status: formValue.status,
          remarks: formValue.remarks
        })
      : this.chargeService.createCharge(requestData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? '更新成功' : '创建成功', '关闭', { duration: 3000 });
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => {}
    });
  }

  onCancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onCheckAccuracy(): void {
    if (!this.chargeId) return;

    const dialogData = {
      title: '收费准确性检查',
      message: '请确认收费信息是否准确。',
      confirmText: '确认准确',
      cancelText: '有问题'
    };
  }
}
