import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatOptionModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HomePage } from './pages/home/home.page';
import { RegisterPage } from './pages/register/register.page';
import { RegisterSuccessPage } from './pages/register-success/register-success.page';
import { StatusPage } from './pages/status/status.page';
import { CheckinPage } from './pages/checkin/checkin.page';
import { RefundApplyPage } from './pages/refund-apply/refund-apply.page';
import { AdminLoginPage } from './pages/admin/login/login.page';
import { AdminLayout } from './layouts/admin.layout';
import { DashboardPage } from './pages/admin/dashboard/dashboard.page';
import { ReviewsPage } from './pages/admin/reviews/reviews.page';
import { GuestsPage } from './pages/admin/guests/guests.page';
import { TicketsPage } from './pages/admin/tickets/tickets.page';
import { SessionsPage } from './pages/admin/sessions/sessions.page';
import { CheckinAdminPage } from './pages/admin/checkin/checkin.page';
import { RefundsPage } from './pages/admin/refunds/refunds.page';
import { NotificationsPage } from './pages/admin/notifications/notifications.page';
import { QualityPage } from './pages/admin/quality/quality.page';
import { FunnelPage } from './pages/admin/funnel/funnel.page';
import { GapPage } from './pages/admin/gap/gap.page';
import { ExceptionsPage } from './pages/admin/exceptions/exceptions.page';
import { KpiCard } from './components/kpi-card/kpi-card.component';
import { StatusBadge } from './components/status-badge/status-badge.component';
import { CloseDialog } from './components/close-dialog/close-dialog.component';
import { ReviewDialog } from './components/review-dialog/review-dialog.component';

@NgModule({
  declarations: [
    AppComponent, HomePage, RegisterPage, RegisterSuccessPage, StatusPage,
    CheckinPage, RefundApplyPage, AdminLoginPage, AdminLayout, DashboardPage,
    ReviewsPage, GuestsPage, TicketsPage, SessionsPage, CheckinAdminPage,
    RefundsPage, NotificationsPage, QualityPage, FunnelPage, GapPage,
    ExceptionsPage, KpiCard, StatusBadge, CloseDialog, ReviewDialog,
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule, HttpClientModule,
    FormsModule, ReactiveFormsModule, RouterModule, AppRoutingModule,
    MatButtonModule, MatIconModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatOptionModule, MatTableModule,
    MatPaginatorModule, MatSortModule, MatDialogModule, MatTabsModule,
    MatSidenavModule, MatToolbarModule, MatListModule, MatBadgeModule,
    MatChipsModule, MatCheckboxModule, MatRadioModule, MatDatepickerModule,
    MatNativeDateModule, MatTooltipModule, MatSnackBarModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatDividerModule,
    MatMenuModule, MatStepperModule, MatGridListModule, MatSlideToggleModule,
    MatAutocompleteModule, MatButtonToggleModule, MatExpansionModule,
    MatTreeModule, MatSliderModule,
    NgxEchartsModule.forRoot({ echarts }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
