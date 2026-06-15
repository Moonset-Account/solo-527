import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BillsComponent } from './pages/bills/bills.component';
import { BillDetailComponent } from './pages/bills/bill-detail.component';
import { CollectionRhythmsComponent } from './pages/collection/collection-rhythms.component';
import { CollectionRecordsComponent } from './pages/collection/collection-records.component';
import { ReconciliationComponent } from './pages/reconciliation/reconciliation.component';
import { ReconciliationDetailComponent } from './pages/reconciliation/reconciliation-detail.component';
import { CashForecastComponent } from './pages/cash-forecast/cash-forecast.component';
import { ExportQueueComponent } from './pages/export/export-queue.component';
import { CustomerSuccessComponent } from './pages/customer-success/customer-success.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, data: { title: '仪表盘' } },
  { path: 'customer-success', component: CustomerSuccessComponent, data: { title: '客户成功视图' } },
  { path: 'bills', component: BillsComponent, data: { title: '应收管理' } },
  { path: 'bills/:id', component: BillDetailComponent, data: { title: '账单详情' } },
  { path: 'collection/rhythms', component: CollectionRhythmsComponent, data: { title: '催收节奏配置' } },
  { path: 'collection/records', component: CollectionRecordsComponent, data: { title: '催收记录' } },
  { path: 'reconciliation', component: ReconciliationComponent, data: { title: '月底核对' } },
  { path: 'reconciliation/:id', component: ReconciliationDetailComponent, data: { title: '核对详情' } },
  { path: 'cash-forecast', component: CashForecastComponent, data: { title: '现金预测' } },
  { path: 'exports', component: ExportQueueComponent, data: { title: '导出队列' } },
];
