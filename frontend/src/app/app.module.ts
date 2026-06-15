import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DateFnsAdapter } from '@angular/material-date-fns-adapter';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

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

import { BillService } from './services/bill.service';
import { CollectionService } from './services/collection.service';
import { ReconciliationService } from './services/reconciliation.service';
import { CashForecastService } from './services/cash-forecast.service';
import { ExportService } from './services/export.service';
import { DashboardService } from './services/dashboard.service';

import { StatusBadgePipe, StatusDisplayPipe } from './pipes/status-badge.pipe';
import { CurrencyPipe } from './pipes/currency.pipe';
import { DateFormatPipe, DateTimeFormatPipe } from './pipes/date-format.pipe';

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'yyyy-MM-dd' },
  display: {
    dateInput: 'yyyy-MM-dd',
    monthYearLabel: 'yyyy MMM',
    dateA11yLabel: 'yyyy-MM-dd',
    monthYearA11yLabel: 'yyyy MMMM',
  },
};

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    BillsComponent,
    BillDetailComponent,
    CollectionRhythmsComponent,
    CollectionRecordsComponent,
    ReconciliationComponent,
    ReconciliationDetailComponent,
    CashForecastComponent,
    ExportQueueComponent,
    CustomerSuccessComponent,
    StatusBadgePipe,
    StatusDisplayPipe,
    CurrencyPipe,
    DateFormatPipe,
    DateTimeFormatPipe,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forRoot(routes),
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  providers: [
    BillService,
    CollectionService,
    ReconciliationService,
    CashForecastService,
    ExportService,
    DashboardService,
    { provide: MAT_DATE_LOCALE, useValue: 'zh-CN' },
    { provide: DateAdapter, useClass: DateFnsAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
