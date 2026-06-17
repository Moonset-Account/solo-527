import { Component, Input } from '@angular/core';
@Component({
  selector: 'kpi-card',
  template: `
    <div class="kpi-card kpi-{{ theme }}">
      <div class="kpi-label">{{ label }}</div>
      <div class="kpi-value">{{ value }}</div>
      <div class="kpi-sub" *ngIf="sub">{{ sub }}</div>
    </div>
  `,
  styles: [``],
})
export class KpiCard {
  @Input() label = '';
  @Input() value: any = 0;
  @Input() sub = '';
  @Input() theme = 'indigo';
}
