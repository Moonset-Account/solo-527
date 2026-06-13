import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() showAddButton: boolean = false;
  @Input() addButtonText: string = '新增';
  @Input() addButtonRouterLink: string | any[] = '';
}
