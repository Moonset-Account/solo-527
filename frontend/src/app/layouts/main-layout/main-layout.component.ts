import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatExpansionModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private cdr = inject(ChangeDetectorRef);
  private breakpointSubscription?: Subscription;

  isHandset = false;

  menuGroups = [
    {
      title: '工作台',
      expanded: true,
      items: [
        { path: '/dashboard', label: '仪表盘', icon: 'dashboard' }
      ]
    },
    {
      title: '租约管理',
      expanded: true,
      items: [
        { path: '/leases', label: '租约查询', icon: 'description' },
        { path: '/bills', label: '账单管理', icon: 'receipt' },
        { path: '/deposits', label: '押金记录', icon: 'savings' }
      ]
    },
    {
      title: '房源管理',
      expanded: true,
      items: [
        { path: '/properties', label: '房源档案', icon: 'apartment' },
        { path: '/room-status', label: '房态管理', icon: 'house_siding' },
        { path: '/pricing', label: '价格管理', icon: 'price_change' }
      ]
    },
    {
      title: '异常管理',
      expanded: true,
      items: [
        { path: '/tickets', label: '维修投诉', icon: 'build' }
      ]
    },
    {
      title: '数据中心',
      expanded: true,
      items: [
        { path: '/export', label: '数据导出', icon: 'file_download' }
      ]
    }
  ];

  ngOnInit(): void {
    this.breakpointSubscription = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches)
      )
      .subscribe(isHandset => {
        this.isHandset = isHandset;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.breakpointSubscription?.unsubscribe();
  }

  onMenuItemClick(drawer: any): void {
    if (this.isHandset) {
      drawer.close();
    }
  }
}
