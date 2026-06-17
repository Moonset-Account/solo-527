import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  stats = [
    { label: '总用户数', value: '1,234', icon: 'people', color: 'primary' },
    { label: '今日订单', value: '56', icon: 'shopping_cart', color: 'accent' },
    { label: '总收入', value: '¥12,580', icon: 'attach_money', color: 'primary' },
    { label: '活跃用户', value: '892', icon: 'trending_up', color: 'accent' }
  ];
}
